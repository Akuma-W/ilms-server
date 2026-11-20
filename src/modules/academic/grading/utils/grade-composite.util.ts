import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { GradeBreakdownItemEntity } from '../gradebook/entities/grade-breakdown-item.entity';
import { CompositeItemConfig } from '../interfaces/grade-category-config.interface';

// Calculates composite score by averaging, weighting, or taking highest across multiple assignments and quizzes
export async function computeCompositeScore(
  prisma: PrismaService,
  studentId: string,
  items: CompositeItemConfig[],
  strategy = 'average',
): Promise<{
  score: number;
  breakdownItems: GradeBreakdownItemEntity[];
}> {
  if (!items || items.length === 0) {
    return { score: 0, breakdownItems: [] };
  }

  const breakdownItems: GradeBreakdownItemEntity[] = [];
  let totalScore = 0;
  let totalWeight = 0;

  for (const item of items) {
    const weight = item.weight || 1.0;

    if (item.type === 'assignment') {
      const assignment = await prisma.assignment.findUnique({
        where: { id: item.id },
        select: { id: true, title: true, maxScore: true },
      });

      if (!assignment) continue;

      const sub = await prisma.submission.findFirst({
        where: { assignmentId: item.id, studentId },
        select: { score: true, submittedAt: true },
      });

      const rawScore = sub?.score ?? null;
      const normalizedScore =
        rawScore !== null
          ? Math.round((rawScore / (assignment.maxScore || 10)) * 10 * 10000) /
            10000
          : 0;

      breakdownItems.push({
        id: assignment.id,
        title: assignment.title,
        type: 'assignment',
        score: normalizedScore,
        maxScore: 10,
        rate: sub?.submittedAt ? 100 : 0,
        weight,
        status: sub?.submittedAt ? 'submitted' : 'missing',
      });

      totalScore += normalizedScore * weight;
      totalWeight += weight;
    } else if (item.type === 'quiz') {
      const publication = await prisma.quizPublication.findFirst({
        where: {
          OR: [{ id: item.id }, { quizId: item.id }],
        },
        include: {
          quiz: {
            select: {
              title: true,
              questions: { select: { points: true } },
            },
          },
        },
      });

      if (!publication) continue;

      const attempts = await prisma.quizAttempt.findMany({
        where: {
          studentId,
          submittedAt: { not: null },
          score: { not: null },
          OR: [
            { publicationId: publication.id },
            { quizId: publication.quizId },
          ],
        },
        select: { score: true },
        orderBy: { score: 'desc' },
      });

      const totalQuizPoints =
        publication.quiz.questions.reduce(
          (sum, q) => sum + (q.points && q.points > 0 ? q.points : 1),
          0,
        ) || 10;

      const highestScore = attempts.length > 0 ? attempts[0].score : null;
      const normalizedScore =
        highestScore !== null
          ? Math.round((highestScore / totalQuizPoints) * 10 * 10000) / 10000
          : 0;

      breakdownItems.push({
        id: publication.id,
        title: publication.quiz.title,
        type: 'quiz',
        score: normalizedScore,
        maxScore: 10,
        rate: attempts.length > 0 ? 100 : 0,
        weight,
        status: attempts.length > 0 ? 'completed' : 'not_attempted',
      });

      totalScore += normalizedScore * weight;
      totalWeight += weight;
    }
  }

  let finalScore = 0;
  if (strategy === 'highest') {
    const validScores = breakdownItems
      .map((b) => b.score)
      .filter((s): s is number => typeof s === 'number');
    finalScore = validScores.length > 0 ? Math.max(...validScores) : 0;
  } else {
    const isWeighted = strategy === 'composite_weighted';
    const denominator = isWeighted ? totalWeight : items.length;
    finalScore =
      denominator > 0
        ? Math.round((totalScore / denominator) * 10000) / 10000
        : 0;
  }

  return {
    score: finalScore,
    breakdownItems,
  };
}
