import { NotFoundException } from '@nestjs/common';
import { GradeSourceType } from 'src/generated/prisma/enums';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { executeCalculateAttendanceGrades } from './attendance-calculator.util';

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

  let syncedCategories = 0;
  let totalGradesUpdated = 0;

  for (const cat of categories) {
    if (cat.sourceType === GradeSourceType.attendance) {
      const res = await executeCalculateAttendanceGrades(prisma, classId, {
        categoryId: cat.id,
      });
      syncedCategories += 1;
      totalGradesUpdated += res.updatedCount;
    } else if (cat.sourceType === GradeSourceType.assignment && cat.sourceId) {
      const assignment = await prisma.assignment.findUnique({
        where: { id: cat.sourceId },
        select: { id: true, maxScore: true },
      });

      if (assignment) {
        const submissions = await prisma.submission.findMany({
          where: {
            assignmentId: assignment.id,
            score: { not: null },
          },
          select: { studentId: true, score: true },
        });

        const maxScore = assignment.maxScore || 10;

        await prisma.$transaction(async (tx) => {
          for (const sub of submissions) {
            if (sub.score === null) continue;
            // Normalizes assignment score to standard 10-point scale
            const normalizedScore =
              Math.round((sub.score / maxScore) * 10 * 10) / 10;

            const existing = await tx.grade.findFirst({
              where: {
                studentId: sub.studentId,
                categoryId: cat.id,
              },
            });

            if (existing) {
              await tx.grade.update({
                where: { id: existing.id },
                data: { score: normalizedScore },
              });
            } else {
              await tx.grade.create({
                data: {
                  studentId: sub.studentId,
                  categoryId: cat.id,
                  score: normalizedScore,
                },
              });
            }
          }
        });

        syncedCategories += 1;
        totalGradesUpdated += submissions.length;
      }
    } else if (cat.sourceType === GradeSourceType.quiz && cat.sourceId) {
      const publication = await prisma.quizPublication.findUnique({
        where: { id: cat.sourceId },
        select: { id: true },
      });

      if (publication) {
        const attempts = await prisma.quizAttempt.findMany({
          where: {
            publicationId: publication.id,
            submittedAt: { not: null },
          },
          select: { studentId: true, score: true },
        });

        // Maps highest attempt score per student
        const highestScoreMap = new Map<string, number>();
        for (const att of attempts) {
          if (att.score === null) continue;
          const current = highestScoreMap.get(att.studentId);
          if (current === undefined || att.score > current) {
            highestScoreMap.set(att.studentId, att.score);
          }
        }

        await prisma.$transaction(async (tx) => {
          for (const [studentId, rawScore] of highestScoreMap.entries()) {
            // Normalizes quiz score to standard 10-point scale
            const normalizedScore = Math.round(rawScore * 10) / 10;

            const existing = await tx.grade.findFirst({
              where: {
                studentId,
                categoryId: cat.id,
              },
            });

            if (existing) {
              await tx.grade.update({
                where: { id: existing.id },
                data: { score: normalizedScore },
              });
            } else {
              await tx.grade.create({
                data: {
                  studentId,
                  categoryId: cat.id,
                  score: normalizedScore,
                },
              });
            }
          }
        });

        syncedCategories += 1;
        totalGradesUpdated += highestScoreMap.size;
      }
    }
  }

  return {
    syncedCategories,
    totalGradesUpdated,
  };
}
