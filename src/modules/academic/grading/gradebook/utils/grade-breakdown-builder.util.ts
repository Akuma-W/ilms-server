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
    items = [
      {
        id: 'metric-meeting',
        title: 'LiveKit online meeting attendance',
        type: 'meeting',
        score: thresholdRes.breakdown.meetingAchieved ? 1 : 0,
        maxScore: 1,
        rate: thresholdRes.breakdown.meetingAchieved ? 100 : 0,
        weight: 1,
        status: thresholdRes.breakdown.meetingAchieved
          ? 'achieved'
          : 'below_threshold',
      },
      {
        id: 'metric-material',
        title: 'Read and complete learning materials',
        type: 'material',
        score: thresholdRes.breakdown.materialAchieved ? 1 : 0,
        maxScore: 1,
        rate: thresholdRes.breakdown.materialAchieved ? 100 : 0,
        weight: 1,
        status: thresholdRes.breakdown.materialAchieved
          ? 'achieved'
          : 'below_threshold',
      },
      {
        id: 'metric-assignment',
        title: 'Submit class assignments',
        type: 'assignment',
        score: thresholdRes.breakdown.assignmentAchieved ? 1 : 0,
        maxScore: 1,
        rate: thresholdRes.breakdown.assignmentAchieved ? 100 : 0,
        weight: 1,
        status: thresholdRes.breakdown.assignmentAchieved
          ? 'achieved'
          : 'below_threshold',
      },
      {
        id: 'metric-quiz',
        title: 'Complete quiz assessments',
        type: 'quiz',
        score: thresholdRes.breakdown.quizAchieved ? 1 : 0,
        maxScore: 1,
        rate: thresholdRes.breakdown.quizAchieved ? 100 : 0,
        weight: 1,
        status: thresholdRes.breakdown.quizAchieved
          ? 'achieved'
          : 'below_threshold',
      },
    ];
  } else if (config.items && config.items.length > 0) {
    strategy = config.strategy || 'composite_average';
    const compositeRes = await computeCompositeScore(
      prisma,
      studentId,
      config.items,
      strategy === 'composite_weighted',
    );
    items = compositeRes.breakdownItems;
  }

  const rawScore = grade?.rawScore ?? (items.length > 0 ? grade?.score : null);
  const overrideScore = grade?.overrideScore ?? null;
  const finalScore = grade?.score ?? 0;
  const isOverridden = grade?.isOverridden ?? false;
  const overrideReason = grade?.overrideReason ?? null;

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
