import { NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { CalculateAttendanceDto } from '../dto/calculate-attendance.dto';
import { computeClassAttendanceSummary } from '../../utils/progress-calculator.util';

// Batch updates calculated attendance/progress scores into Grade table inside a transaction
export async function executeCalculateAttendanceGrades(
  prisma: PrismaService,
  classId: string,
  dto?: CalculateAttendanceDto,
): Promise<{ categoryId: string; categoryName: string; updatedCount: number }> {
  const summary = await computeClassAttendanceSummary(prisma, classId, dto);
  const category = await prisma.gradeCategory.findUnique({
    where: { id: summary.categoryId },
    select: { id: true, name: true, config: true },
  });

  if (!category) {
    throw new NotFoundException('Category not found');
  }

  // Persists configured weights and thresholds into category config for automatic recalibration
  if (dto) {
    const prevConfig =
      typeof category.config === 'object' && category.config !== null
        ? (category.config as Record<string, unknown>)
        : {};
    const prevPillars = prevConfig.pillars as
      | Record<string, { weight?: number; minRate?: number }>
      | undefined;
    const meetingMinRate =
      dto.meetingThreshold ??
      dto.meetingMinRate ??
      prevPillars?.meetings?.minRate ??
      0;
    const materialMinRate =
      dto.materialThreshold ??
      dto.materialMinRate ??
      prevPillars?.materials?.minRate ??
      0;
    const assignmentMinRate =
      dto.assignmentThreshold ?? prevPillars?.assignments?.minRate ?? 0;
    const quizMinRate = dto.quizThreshold ?? prevPillars?.quizzes?.minRate ?? 0;

    await prisma.gradeCategory.update({
      where: { id: category.id },
      data: {
        config: {
          ...prevConfig,
          sourceType: 'attendance',
          pillars: {
            meetings: {
              weight: summary.meetingWeight,
              minRate: meetingMinRate,
            },
            materials: {
              weight: summary.materialWeight,
              minRate: materialMinRate,
            },
            assignments: {
              weight: summary.assignmentWeight,
              minRate: assignmentMinRate,
            },
            quizzes: {
              weight: summary.quizWeight,
              minRate: quizMinRate,
            },
          },
        },
      },
    });
  }

  // Atomic batch update of calculated attendance scores into Grade table
  await prisma.$transaction(async (tx) => {
    for (const item of summary.students) {
      const existing = await tx.grade.findFirst({
        where: {
          studentId: item.studentId,
          categoryId: category.id,
        },
      });

      if (existing) {
        const isRealOverride =
          existing.isOverridden &&
          existing.overrideScore !== null &&
          existing.overrideScore !== undefined;

        if (dto?.preserveOverrides !== false && isRealOverride) {
          await tx.grade.update({
            where: { id: existing.id },
            data: { rawScore: item.calculatedScore },
          });
          continue;
        }
        await tx.grade.update({
          where: { id: existing.id },
          data: {
            score: item.calculatedScore,
            rawScore: item.calculatedScore,
            isOverridden: false,
            overrideScore: null,
            overrideReason: null,
          },
        });
      } else {
        await tx.grade.create({
          data: {
            studentId: item.studentId,
            categoryId: category.id,
            score: item.calculatedScore,
            rawScore: item.calculatedScore,
          },
        });
      }
    }
  });

  return {
    categoryId: category.id,
    categoryName: category.name,
    updatedCount: summary.students.length,
  };
}
