import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { GradeCategoryConfig } from '../../interfaces/grade-category-config.interface';
import { computeCompositeScore } from '../../utils/grade-composite.util';

// Synchronizes grades for composite coursework categories containing mixed assignments and quizzes
export async function executeSyncCompositeGrades(
  prisma: PrismaService,
  categoryId: string,
  config: GradeCategoryConfig,
  studentIds: string[],
): Promise<number> {
  if (!config.items || config.items.length === 0) {
    return 0;
  }

  await prisma.$transaction(async (tx) => {
    for (const studentId of studentIds) {
      const res = await computeCompositeScore(
        prisma,
        studentId,
        config.items!,
        config.strategy || 'average',
      );
      const computedScore = res.score;
      const existing = await tx.grade.findFirst({
        where: { studentId, categoryId },
      });

      if (existing) {
        if (!existing.isOverridden) {
          await tx.grade.update({
            where: { id: existing.id },
            data: { score: computedScore, rawScore: computedScore },
          });
        } else {
          await tx.grade.update({
            where: { id: existing.id },
            data: { rawScore: computedScore },
          });
        }
      } else {
        await tx.grade.create({
          data: {
            studentId,
            categoryId,
            score: computedScore,
            rawScore: computedScore,
          },
        });
      }
    }
  });

  return studentIds.length;
}
