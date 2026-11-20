import { NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { GradeBreakdownItemEntity } from '../entities/grade-breakdown-item.entity';
import { GradeCategoryBreakdownEntity } from '../entities/grade-category-breakdown.entity';
import { GradeCategoryConfig } from '../../interfaces/grade-category-config.interface';
import { computeCompositeScore } from '../../utils/grade-composite.util';
import { computeThresholdAttendanceScore } from '../../utils/grade-threshold.util';

// Builds comprehensive breakdown of component items and calculation strategy for category
export async function buildCategoryBreakdown(
  prisma: PrismaService,
  classId: string,
  categoryId: string,
  studentId: string,
): Promise<GradeCategoryBreakdownEntity> {
  const category = await prisma.gradeCategory.findFirst({
    where: { id: categoryId, classId },
  });

  if (!category) {
    throw new NotFoundException('Grade category not found');
  }

  const grade = await prisma.grade.findUnique({
    where: {
      studentId_categoryId: { studentId, categoryId },
    },
  });

  const config = (category.config as GradeCategoryConfig) || {};
  let items: GradeBreakdownItemEntity[] = [];
  let strategy = config.strategy || 'manual';

  if (category.sourceType === 'attendance') {
    strategy = config.strategy || 'attendance_threshold';
    const thresholdRes = await computeThresholdAttendanceScore(
      prisma,
      classId,
      studentId,
      config,
    );
    const c = thresholdRes.breakdown.counts;
    const r = thresholdRes.breakdown.rates;
    const p = config.pillars;

    const allMetrics: GradeBreakdownItemEntity[] = [
      {
        id: 'metric-meeting',
        title: `Tham gia lớp học trực tuyến (${c.attendedMeetings}/${c.totalMeetings} buổi)`,
        type: 'meeting',
        score: thresholdRes.breakdown.meetingScore10 ?? 0,
        maxScore: 10,
        rate: Math.round(r.meetingRate),
        weight: p?.meetings?.weight ?? 0.25,
        status: thresholdRes.breakdown.meetingAchieved
          ? 'achieved'
          : 'below_threshold',
      },
      {
        id: 'metric-material',
        title: `Đọc và nghiên cứu bài giảng (${c.readMaterials}/${c.totalMaterials} bài)`,
        type: 'material',
        score: thresholdRes.breakdown.materialScore10 ?? 0,
        maxScore: 10,
        rate: Math.round(r.materialRate),
        weight: p?.materials?.weight ?? 0.25,
        status: thresholdRes.breakdown.materialAchieved
          ? 'achieved'
          : 'below_threshold',
      },
      {
        id: 'metric-assignment',
        title: `Hoàn thành bài tập quá trình (${c.submittedAssignments}/${c.totalAssignments} bài)`,
        type: 'assignment',
        score: thresholdRes.breakdown.assignmentScore10 ?? 0,
        maxScore: 10,
        rate: Math.round(r.assignmentRate),
        weight: p?.assignments?.weight ?? 0.25,
        status: thresholdRes.breakdown.assignmentAchieved
          ? 'achieved'
          : 'below_threshold',
      },
      {
        id: 'metric-quiz',
        title: `Làm bài kiểm tra trắc nghiệm (${c.attemptedQuizzes}/${c.totalQuizzes} bài)`,
        type: 'quiz',
        score: thresholdRes.breakdown.quizScore10 ?? 0,
        maxScore: 10,
        rate: Math.round(r.quizRate),
        weight: p?.quizzes?.weight ?? 0.25,
        status: thresholdRes.breakdown.quizAchieved
          ? 'achieved'
          : 'below_threshold',
      },
    ];

    items = allMetrics.filter((m) => (m.weight ?? 0) > 0);
  } else if (category.sourceType === 'manual') {
    strategy = 'manual';
    items = [
      {
        id: 'metric-manual',
        title: 'Điểm số do Giảng viên trực tiếp nhập hoặc điều chỉnh',
        type: 'manual',
        score: grade?.score ?? 0,
        maxScore: 10,
        rate: 100,
        weight: 1,
        status: 'graded',
      },
    ];
  } else if (config.items && config.items.length > 0) {
    strategy = config.strategy || 'composite_average';
    const compositeRes = await computeCompositeScore(
      prisma,
      studentId,
      config.items,
      config.strategy || 'average',
    );
    items = compositeRes.breakdownItems;
  } else if (category.sourceType === 'assignment') {
    strategy = 'assignment_sync';
    const assignmentWhere = category.sourceId
      ? { id: category.sourceId, classId }
      : { classId };

    const assignments = await prisma.assignment.findMany({
      where: assignmentWhere,
      select: {
        id: true,
        title: true,
        maxScore: true,
        submissions: {
          where: { studentId },
          select: { score: true, submittedAt: true },
          take: 1,
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    items = assignments.map((a) => {
      const sub = a.submissions[0];
      const maxScore = a.maxScore || 10;
      const rawScore = sub?.score ?? null;
      const normalizedScore =
        rawScore !== null
          ? Math.round((rawScore / maxScore) * 10 * 10) / 10
          : 0;

      return {
        id: a.id,
        title: a.title,
        type: 'assignment',
        score: normalizedScore,
        maxScore: 10,
        rate: sub?.submittedAt ? 100 : 0,
        weight: 1,
        status: sub?.submittedAt ? 'submitted' : 'missing',
      };
    });
  } else if (category.sourceType === 'quiz') {
    strategy = 'quiz_sync';
    const publicationWhere = category.sourceId
      ? {
          classId,
          OR: [{ id: category.sourceId }, { quizId: category.sourceId }],
        }
      : { classId };

    const publications = await prisma.quizPublication.findMany({
      where: publicationWhere,
      include: {
        quiz: {
          select: {
            title: true,
            questions: { select: { points: true } },
          },
        },
        attempts: {
          where: { studentId, submittedAt: { not: null } },
          select: { score: true, submittedAt: true },
          orderBy: { score: 'desc' },
          take: 1,
        },
      },
      orderBy: { publishedAt: 'asc' },
    });

    items = publications.map((pub) => {
      const best = pub.attempts[0];
      const totalPoints =
        pub.quiz.questions.reduce(
          (sum, q) => sum + (q.points && q.points > 0 ? q.points : 1),
          0,
        ) || 10;
      const normalizedScore =
        best?.score !== null && best?.score !== undefined
          ? Math.round((best.score / totalPoints) * 10 * 10) / 10
          : 0;

      return {
        id: pub.id,
        title: pub.quiz.title,
        type: 'quiz',
        score: normalizedScore,
        maxScore: 10,
        rate: best ? 100 : 0,
        weight: 1,
        status: best ? 'completed' : 'not_attempted',
      };
    });
  }

  const rawScore = grade?.rawScore ?? (items.length > 0 ? grade?.score : null);
  const finalScore = grade?.score ?? 0;
  const rawOverrideScore = grade?.overrideScore ?? null;

  const isGenuinelyOverridden =
    category.sourceType !== 'manual' &&
    (grade?.isOverridden ?? false) &&
    (rawScore !== null && rawScore !== undefined
      ? Math.abs(rawScore - finalScore) >= 0.001
      : rawOverrideScore !== null && rawOverrideScore !== undefined);

  const isOverridden = isGenuinelyOverridden;
  const overrideScore = isOverridden
    ? (rawOverrideScore ?? (finalScore !== rawScore ? finalScore : null))
    : null;
  const overrideReason = isOverridden ? (grade?.overrideReason ?? null) : null;

  return {
    categoryId: category.id,
    categoryName: category.name,
    weight: category.weight,
    strategy,
    rawScore,
    overrideScore,
    finalScore,
    isOverridden,
    overrideReason,
    items,
  };
}
