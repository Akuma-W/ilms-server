import { NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { OverrideGradeDto } from '../dto/override-grade.dto';

// Applies teacher manual grade override or adjustment while preserving raw score
export async function executeGradeOverride(
  prisma: PrismaService,
  classId: string,
  dto: OverrideGradeDto,
): Promise<{
  id: string;
  studentId: string;
  categoryId: string;
  rawScore: number | null;
  overrideScore: number | null;
  score: number;
  isOverridden: boolean;
  overrideReason: string | null;
}> {
  const category = await prisma.gradeCategory.findFirst({
    where: { id: dto.categoryId, classId },
  });

  if (!category) {
    throw new NotFoundException('Grade category not found in this class');
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: {
      classId_userId: { classId, userId: dto.studentId },
    },
  });

  if (!enrollment) {
    throw new NotFoundException('Student is not enrolled in this class');
  }

  const existingGrade = await prisma.grade.findUnique({
    where: {
      studentId_categoryId: {
        studentId: dto.studentId,
        categoryId: dto.categoryId,
      },
    },
  });

  const roundedScore = Math.round(dto.score * 10) / 10;
  const reason = dto.reason?.trim() || null;

  if (existingGrade) {
    return prisma.grade.update({
      where: { id: existingGrade.id },
      data: {
        overrideScore: roundedScore,
        score: roundedScore,
        isOverridden: true,
        overrideReason: reason,
      },
      select: {
        id: true,
        studentId: true,
        categoryId: true,
        rawScore: true,
        overrideScore: true,
        score: true,
        isOverridden: true,
        overrideReason: true,
      },
    });
  }

  return prisma.grade.create({
    data: {
      studentId: dto.studentId,
      categoryId: dto.categoryId,
      rawScore: null,
      overrideScore: roundedScore,
      score: roundedScore,
      isOverridden: true,
      overrideReason: reason,
    },
    select: {
      id: true,
      studentId: true,
      categoryId: true,
      rawScore: true,
      overrideScore: true,
      score: true,
      isOverridden: true,
      overrideReason: true,
    },
  });
}
