import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { BatchUpdateGradesDto } from './dto/batch-update-grades.dto';
import { CalculateAttendanceDto } from './dto/calculate-attendance.dto';
import { SyncGradesDto } from './dto/sync-grades.dto';
import { OverrideGradeDto } from './dto/override-grade.dto';
import { executeCalculateAttendanceGrades } from './utils/attendance-calculator.util';
import { executeSyncClassGrades } from './utils/grade-sync.util';
import { executeGradeOverride } from './utils/grade-override.util';

@Injectable()
export class CalculationsService {
  constructor(private readonly prisma: PrismaService) {}

  // Updates student scores in batch across categories using a database transaction
  async batchUpdateGrades(
    classId: string,
    dto: BatchUpdateGradesDto,
  ): Promise<{ success: boolean; message: string; count: number }> {
    // Step 1: Fetch and validate category IDs belonging to this classroom
    const validCategories = await this.prisma.gradeCategory.findMany({
      where: { classId },
      select: { id: true },
    });
    const validCategorySet = new Set(validCategories.map((c) => c.id));

    const validUpdates = dto.updates.filter((item) =>
      validCategorySet.has(item.categoryId),
    );

    if (validUpdates.length === 0) {
      return {
        success: true,
        message: 'No valid category grades to update',
        count: 0,
      };
    }

    // Step 2: Upsert each valid score inside an atomic Prisma transaction
    await this.prisma.$transaction(async (tx) => {
      for (const item of validUpdates) {
        const existing = await tx.grade.findFirst({
          where: {
            studentId: item.studentId,
            categoryId: item.categoryId,
          },
        });

        if (existing) {
          await tx.grade.update({
            where: { id: existing.id },
            data: { score: item.score },
          });
        } else {
          await tx.grade.create({
            data: {
              studentId: item.studentId,
              categoryId: item.categoryId,
              score: item.score,
            },
          });
        }
      }
    });

    return {
      success: true,
      message: 'Batch grades updated successfully',
      count: validUpdates.length,
    };
  }

  // Automatically calculates attendance scores from learning progress and sessions
  async calculateAttendance(
    classId: string,
    dto: CalculateAttendanceDto,
  ): Promise<{
    categoryId: string;
    categoryName: string;
    updatedCount: number;
  }> {
    return executeCalculateAttendanceGrades(this.prisma, classId, dto);
  }

  // Automatically synchronizes grades from designated source artifacts (assignments, quizzes, attendance)
  async syncGrades(
    classId: string,
    dto: SyncGradesDto,
  ): Promise<{ syncedCategories: number; totalGradesUpdated: number }> {
    return executeSyncClassGrades(this.prisma, classId, dto.categoryId);
  }

  // Manually overrides or adjusts a student score with reason while preserving raw score history
  async overrideGrade(classId: string, dto: OverrideGradeDto) {
    return executeGradeOverride(this.prisma, classId, dto);
  }
}
