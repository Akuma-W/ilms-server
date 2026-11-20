import { NotFoundException } from '@nestjs/common';
import {
  EnrollmentStatus,
  GradeSourceType,
  Role,
} from 'src/generated/prisma/enums';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { executeCalculateAttendanceGrades } from './attendance-calculator.util';
import { GradeCalculationStrategy } from '../../constants/grade-strategy.constant';
import { GradeCategoryConfig } from '../../interfaces/grade-category-config.interface';
import { executeSyncCompositeGrades } from './grade-composite-sync.util';

// Atomic upsert helper preserving genuine overrides during automated synchronization
async function upsertSyncedGrade(
  tx: {
    grade: {
      findFirst: (args: unknown) => Promise<{
        id: string;
        isOverridden?: boolean;
        overrideScore?: number | null;
      } | null>;
      update: (args: unknown) => Promise<unknown>;
      create: (args: unknown) => Promise<unknown>;
    };
  },
  studentId: string,
  categoryId: string,
  score: number,
): Promise<void> {
  const existing = await tx.grade.findFirst({
    where: { studentId, categoryId },
  });
  const isReal =
    existing?.isOverridden &&
    existing.overrideScore !== null &&
    existing.overrideScore !== undefined;

  if (existing) {
    if (!isReal) {
      await tx.grade.update({
        where: { id: existing.id },
        data: {
          score,
          rawScore: score,
          isOverridden: false,
          overrideScore: null,
          overrideReason: null,
        },
      });
    } else {
      await tx.grade.update({
        where: { id: existing.id },
        data: { rawScore: score },
      });
    }
  } else {
    await tx.grade.create({
      data: { studentId, categoryId, score, rawScore: score },
    });
  }
}

// Synchronizes computed grades for automated categories in a class
export async function executeSyncClassGrades(
  prisma: PrismaService,
  classId: string,
  targetCategoryId?: string,
): Promise<{ syncedCategories: number; totalGradesUpdated: number }> {
  const whereCondition = targetCategoryId
    ? { id: targetCategoryId, classId }
    : { classId, sourceType: { not: GradeSourceType.manual } };

  const categories = await prisma.gradeCategory.findMany({
    where: whereCondition,
  });

  if (targetCategoryId && categories.length === 0) {
    throw new NotFoundException(
      'Target grade category not found in this class',
    );
  }

  // Get enrolled approved students
  const enrollments = await prisma.enrollment.findMany({
    where: {
      classId,
      roleIn: Role.student,
      status: EnrollmentStatus.approved,
    },
    select: { userId: true },
  });
  const studentIds: string[] = enrollments.map((e) => e.userId);

  let syncedCategories = 0;
  let totalGradesUpdated = 0;

  for (const cat of categories) {
    const config = (cat.config as GradeCategoryConfig) || {};

    if (config.items && config.items.length > 0) {
      const updated = await executeSyncCompositeGrades(
        prisma,
        cat.id,
        config,
        studentIds,
      );
      syncedCategories += 1;
      totalGradesUpdated += updated;
      continue;
    }

    if (cat.sourceType === GradeSourceType.attendance) {
      const res = await executeCalculateAttendanceGrades(prisma, classId, {
        categoryId: cat.id,
      });
      syncedCategories += 1;
      totalGradesUpdated += res.updatedCount;
    } else if (cat.sourceType === GradeSourceType.assignment) {
      // Determine target assignment IDs
      let targetAssignmentIds: string[] = [];
      if (config.items && config.items.length > 0) {
        targetAssignmentIds = config.items
          .filter((i) => i.type === 'assignment')
          .map((i) => i.id);
      } else if (cat.sourceId) {
        targetAssignmentIds = [cat.sourceId];
      } else {
        const allAssignments = await prisma.assignment.findMany({
          where: { classId },
          select: { id: true },
        });
        targetAssignmentIds = allAssignments.map((a) => a.id);
      }

      if (targetAssignmentIds.length === 0) continue;

      const assignments = await prisma.assignment.findMany({
        where: { id: { in: targetAssignmentIds } },
        select: { id: true, maxScore: true },
      });
      const assignmentMap = new Map(assignments.map((a) => [a.id, a]));

      const submissions = await prisma.submission.findMany({
        where: {
          assignmentId: { in: targetAssignmentIds },
          studentId: { in: studentIds },
          score: { not: null },
        },
        select: { studentId: true, assignmentId: true, score: true },
      });

      // Group submissions by student
      const studentSubmissionsMap = new Map<
        string,
        Array<{ assignmentId: string; normalizedScore: number }>
      >();
      for (const sub of submissions) {
        if (sub.score === null) continue;
        const assign = assignmentMap.get(sub.assignmentId);
        const max = assign?.maxScore || 10;
        const norm = Math.round((sub.score / max) * 10 * 10) / 10;

        const list = studentSubmissionsMap.get(sub.studentId) || [];
        list.push({ assignmentId: sub.assignmentId, normalizedScore: norm });
        studentSubmissionsMap.set(sub.studentId, list);
      }

      await prisma.$transaction(async (tx) => {
        for (const studentId of studentIds) {
          const subs = studentSubmissionsMap.get(studentId) || [];
          let computedScore = 0;

          if (
            config.strategy === GradeCalculationStrategy.threshold &&
            config.thresholdCount
          ) {
            const submittedCount = subs.length;
            const threshold = Math.max(1, config.thresholdCount);
            const rate = Math.min(1.0, submittedCount / threshold);
            const avgScore =
              subs.length > 0
                ? subs.reduce((sum: number, s) => sum + s.normalizedScore, 0) /
                  subs.length
                : 10;
            computedScore = Math.round(avgScore * rate * 10) / 10;
          } else if (
            config.strategy === GradeCalculationStrategy.dropLowest &&
            subs.length > 1 &&
            targetAssignmentIds.length > 1
          ) {
            const sorted = [...subs].sort(
              (a, b) => a.normalizedScore - b.normalizedScore,
            );
            sorted.shift();
            computedScore =
              Math.round(
                (sorted.reduce((sum: number, s) => sum + s.normalizedScore, 0) /
                  sorted.length) *
                  10,
              ) / 10;
          } else {
            computedScore =
              subs.length > 0
                ? Math.round(
                    (subs.reduce(
                      (sum: number, s) => sum + s.normalizedScore,
                      0,
                    ) /
                      targetAssignmentIds.length) *
                      10,
                  ) / 10
                : 0;
          }

          await upsertSyncedGrade(tx, studentId, cat.id, computedScore);
        }
      });

      syncedCategories += 1;
      totalGradesUpdated += studentIds.length;
    } else if (cat.sourceType === GradeSourceType.quiz) {
      // Determine target quiz publication IDs
      let targetPubIds: string[] = [];
      if (config.items && config.items.length > 0) {
        targetPubIds = config.items
          .filter((i) => i.type === 'quiz')
          .map((i) => i.id);
      } else if (cat.sourceId) {
        targetPubIds = [cat.sourceId];
      } else {
        const allPubs = await prisma.quizPublication.findMany({
          where: { classId },
          select: { id: true },
        });
        targetPubIds = allPubs.map((p) => p.id);
      }

      if (targetPubIds.length === 0) continue;

      const publications = await prisma.quizPublication.findMany({
        where: {
          classId,
          OR: [{ id: { in: targetPubIds } }, { quizId: { in: targetPubIds } }],
        },
        include: {
          quiz: {
            select: {
              questions: { select: { points: true } },
            },
          },
        },
      });
      const pubMaxPointsMap = new Map<string, number>();
      for (const pub of publications) {
        const total =
          pub.quiz.questions.reduce(
            (sum, q) => sum + (q.points && q.points > 0 ? q.points : 1),
            0,
          ) || 10;
        pubMaxPointsMap.set(pub.id, total);
      }

      const foundPubIds = publications.map((p) => p.id);
      const attempts = await prisma.quizAttempt.findMany({
        where: {
          publicationId: { in: foundPubIds },
          studentId: { in: studentIds },
          submittedAt: { not: null },
          score: { not: null },
        },
        select: { studentId: true, publicationId: true, score: true },
        orderBy: { score: 'desc' },
      });

      // Map highest score per publication for each student
      const studentQuizMap = new Map<string, Map<string | null, number>>();
      for (const att of attempts) {
        if (att.score === null) continue;
        const maxPts = att.publicationId
          ? pubMaxPointsMap.get(att.publicationId) || 10
          : 10;
        const norm = Math.round((att.score / maxPts) * 10 * 10) / 10;
        let pubMap = studentQuizMap.get(att.studentId);
        if (!pubMap) {
          pubMap = new Map<string | null, number>();
          studentQuizMap.set(att.studentId, pubMap);
        }
        const cur = pubMap.get(att.publicationId);
        if (cur === undefined || norm > cur) {
          pubMap.set(att.publicationId, norm);
        }
      }

      await prisma.$transaction(async (tx) => {
        for (const studentId of studentIds) {
          const pubMap =
            studentQuizMap.get(studentId) ?? new Map<string, number>();
          const scores: number[] = Array.from(pubMap.values());
          let computedScore = 0;

          if (
            config.strategy === GradeCalculationStrategy.threshold &&
            config.thresholdCount
          ) {
            const attemptedCount = scores.length;
            const threshold = Math.max(1, config.thresholdCount);
            const rate = Math.min(1.0, attemptedCount / threshold);
            const avgScore =
              scores.length > 0
                ? scores.reduce((sum: number, s: number) => sum + s, 0) /
                  scores.length
                : 10;
            computedScore = Math.round(avgScore * rate * 10) / 10;
          } else if (
            config.strategy === GradeCalculationStrategy.dropLowest &&
            scores.length > 1 &&
            targetPubIds.length > 1
          ) {
            const sorted: number[] = [...scores].sort((a, b) => a - b);
            sorted.shift();
            computedScore =
              Math.round(
                (sorted.reduce((sum: number, s: number) => sum + s, 0) /
                  sorted.length) *
                  10,
              ) / 10;
          } else {
            computedScore =
              scores.length > 0
                ? Math.round(
                    (scores.reduce((sum: number, s: number) => sum + s, 0) /
                      targetPubIds.length) *
                      10,
                  ) / 10
                : 0;
          }

          await upsertSyncedGrade(tx, studentId, cat.id, computedScore);
        }
      });

      syncedCategories += 1;
      totalGradesUpdated += studentIds.length;
    }
  }

  return { syncedCategories, totalGradesUpdated };
}
