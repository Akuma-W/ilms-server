import { NotFoundException } from '@nestjs/common';
import { GradeSourceType } from 'src/generated/prisma/enums';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';

// Resolves target attendance grade category by ID, designated source type, or name fallback
export async function resolveAttendanceCategory(
  prisma: PrismaService,
  classId: string,
  targetCategoryId?: string,
) {
  if (targetCategoryId) {
    const category = await prisma.gradeCategory.findFirst({
      where: { id: targetCategoryId, classId },
    });
    if (!category) {
      throw new NotFoundException(
        'Target grade category not found in this class',
      );
    }
    return category;
  }

  // Finds category designated as attendance source type
  let category = await prisma.gradeCategory.findFirst({
    where: { classId, sourceType: GradeSourceType.attendance },
  });

  // Fallback: finds category named "Attendance" or "Chuyên cần"
  if (!category) {
    category = await prisma.gradeCategory.findFirst({
      where: {
        classId,
        OR: [
          { name: { contains: 'Attendance', mode: 'insensitive' } },
          { name: { contains: 'Chuyên cần', mode: 'insensitive' } },
        ],
      },
    });
  }

  if (!category) {
    throw new NotFoundException(
      'Attendance grade category not found. Please create a category with Attendance source type first.',
    );
  }

  return category;
}
