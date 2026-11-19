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
    select: { id: true, name: true },
  });

  if (!category) {
    throw new NotFoundException('Category not found');
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
        await tx.grade.update({
          where: { id: existing.id },
          data: { score: item.calculatedScore },
        });
      } else {
        await tx.grade.create({
          data: {
            studentId: item.studentId,
            categoryId: category.id,
            score: item.calculatedScore,
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
