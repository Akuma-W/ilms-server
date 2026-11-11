import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { EnrollmentStatus, Role } from 'src/generated/prisma/enums';
import { checkTeacherPermission } from '../utils/academic-permission.util';
import { GradeCategoriesService } from '../grade-categories/grade-categories.service';
import { BatchUpdateGradesDto } from './dto/batch-update-grades.dto';
import { ClassGradeMatrixEntity } from './entities/grade-matrix.entity';
import {
  DetailedGradeItemEntity,
  GradeRecordEntity,
  StudentCategoryGradeEntity,
} from './entities/grade-record.entity';

@Injectable()
export class GradesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gradeCategoriesService: GradeCategoriesService,
  ) {}

  // Retrieves the full class grade matrix and calculates KPI stats for teacher/admin view
  async getGradeMatrix(
    userId: string,
    userRole: string,
    classId: string,
  ): Promise<ClassGradeMatrixEntity> {
    // Step 1: Validate teacher or admin permissions
    await checkTeacherPermission(this.prisma, userId, classId, userRole);

    // Step 2: Auto-initialize standard 3 categories (20/30/50%) if none exist
    await this.gradeCategoriesService.ensureDefaultCategories(classId);

    // Step 3: Fetch categories ordered by sequence index
    const categories = await this.prisma.gradeCategory.findMany({
      where: { classId },
      orderBy: { orderIndex: 'asc' },
    });

    // Step 4: Fetch all approved students enrolled in this classroom
    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        classId,
        roleIn: Role.student,
        status: EnrollmentStatus.approved,
      },
      include: {
        user: true,
      },
      orderBy: {
        user: { fullName: 'asc' },
      },
    });

    // Step 5: Fetch all existing grades for this class
    const grades = await this.prisma.grade.findMany({
      where: {
        category: { classId },
      },
    });

    // Step 6: Index scores into an in-memory lookup map: studentId -> categoryId -> score
    const studentScoreMap = new Map<string, Map<string, number>>();
    for (const g of grades) {
      if (!studentScoreMap.has(g.studentId)) {
        studentScoreMap.set(g.studentId, new Map());
      }
      studentScoreMap.get(g.studentId)!.set(g.categoryId, g.score);
    }

    // Step 7: Build matrix rows, computing finalScore, letterGrade, and GPA 4.0 only when scores exist
    const rows = enrollments.map((e) => {
      const studentId = e.user.id;
      const scores: Record<string, number | null> = {};
      let weightedSum = 0;
      let hasAnyScore = false;

      for (const cat of categories) {
        const score = studentScoreMap.get(studentId)?.get(cat.id) ?? null;
        scores[cat.id] = score;
        if (score !== null) {
          weightedSum += score * cat.weight;
          hasAnyScore = true;
        }
      }

      // Do not compute summary if the student has no recorded grades yet
      const finalScore = hasAnyScore
        ? Number((Math.round(weightedSum * 10) / 10).toFixed(1))
        : null;
      const letterGrade =
        finalScore !== null ? this.convertToLetterGrade(finalScore) : null;
      const gpa4 = finalScore !== null ? this.convertToGpa4(finalScore) : null;

      return {
        studentId,
        studentName: e.user.fullName,
        studentEmail: e.user.email,
        studentCode: e.user.identityCode ?? `SV-${studentId.substring(0, 6)}`,
        avatarUrl: e.user.avatarUrl,
        scores,
        finalScore,
        gpa4,
        letterGrade,
      };
    });

    // Step 8: Calculate overall classroom KPIs exclusively over students who have received grades
    const totalStudents = rows.length;
    const gradedRows = rows.filter((r) => r.finalScore !== null);
    const totalGraded = gradedRows.length;
    const passingStudents = gradedRows.filter(
      (r) => (r.finalScore ?? 0) >= 5.0,
    ).length;
    const averageScore =
      totalGraded > 0
        ? (
            gradedRows.reduce((sum, r) => sum + (r.finalScore ?? 0), 0) /
            totalGraded
          ).toFixed(2)
        : '-';
    const passingRate =
      totalGraded > 0
        ? Number(((passingStudents / totalGraded) * 100).toFixed(1))
        : 0;

    return {
      categories,
      rows,
      totalStudents,
      averageScore,
      passingRate,
    };
  }

  // Updates student scores in batch across categories using a database transaction
  async batchUpdateGrades(
    userId: string,
    userRole: string,
    classId: string,
    dto: BatchUpdateGradesDto,
  ): Promise<{ success: boolean; message: string; count: number }> {
    // Step 1: Validate teacher or admin permissions
    await checkTeacherPermission(this.prisma, userId, classId, userRole);

    // Step 2: Fetch and validate category IDs belonging to this classroom
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

    // Step 3: Upsert each valid score inside an atomic Prisma transaction
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

  // Retrieves personal grade record for a student with category breakdown and detailed items
  async getMyGradeRecord(
    userId: string,
    userRole: string,
    classId: string,
    targetStudentId?: string,
  ): Promise<GradeRecordEntity> {
    // Step 1: Resolve target student ID (current user or specific student for teacher/admin view)
    const studentId = targetStudentId || userId;

    if (targetStudentId && targetStudentId !== userId) {
      await checkTeacherPermission(this.prisma, userId, classId, userRole);
    }

    // Step 2: Verify student exists
    const student = await this.prisma.user.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Step 3: Ensure default categories and fetch ordered by sequence index
    await this.gradeCategoriesService.ensureDefaultCategories(classId);
    const categories = await this.prisma.gradeCategory.findMany({
      where: { classId },
      orderBy: { orderIndex: 'asc' },
    });

    // Step 4: Fetch student category grades
    const grades = await this.prisma.grade.findMany({
      where: {
        studentId,
        category: { classId },
      },
    });

    const gradeMap = new Map(grades.map((g) => [g.categoryId, g.score]));
    let weightedSum = 0;
    let hasAnyScore = false;

    const categoryGrades: StudentCategoryGradeEntity[] = categories.map(
      (cat) => {
        const score = gradeMap.get(cat.id) ?? null;
        const weightedScore =
          score !== null ? Number((score * cat.weight).toFixed(2)) : null;

        if (weightedScore !== null) {
          weightedSum += weightedScore;
          hasAnyScore = true;
        }

        return {
          categoryId: cat.id,
          categoryName: cat.name,
          weight: cat.weight,
          score,
          weightedScore,
        };
      },
    );

    const finalScore = hasAnyScore
      ? Number((Math.round(weightedSum * 10) / 10).toFixed(1))
      : null;
    const letterGrade =
      finalScore !== null ? this.convertToLetterGrade(finalScore) : null;
    const gpa4 = finalScore !== null ? this.convertToGpa4(finalScore) : null;
    const isPassed = finalScore !== null ? finalScore >= 4.0 : null;

    // Step 5: Fetch classroom assignments and submission records for detailed items
    const assignments = await this.prisma.assignment.findMany({
      where: { classId },
      include: {
        submissions: {
          where: { studentId },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    let submittedCount = 0;
    const detailedItems: DetailedGradeItemEntity[] = assignments.map((a) => {
      const sub = a.submissions[0];
      const isGraded = sub?.score !== null && sub?.score !== undefined;
      const status: 'graded' | 'pending' | 'unsubmitted' = sub
        ? isGraded
          ? 'graded'
          : 'pending'
        : 'unsubmitted';

      if (sub) {
        submittedCount += 1;
      }

      return {
        id: a.id,
        title: a.title,
        type: 'assignment',
        maxScore: 10,
        earnedScore: sub?.score ?? null,
        status,
        feedback: sub?.feedback ?? null,
        submittedAt: sub?.submittedAt ? sub.submittedAt.toISOString() : null,
      };
    });

    const completionRate =
      assignments.length > 0
        ? Math.round((submittedCount / assignments.length) * 100)
        : 100;

    return {
      studentId,
      studentName: student.fullName,
      studentEmail: student.email,
      studentCode: student.identityCode ?? `SV-${studentId.substring(0, 6)}`,
      avatarUrl: student.avatarUrl,
      categoryGrades,
      detailedItems,
      finalScore,
      gpa4,
      letterGrade,
      isPassed,
      completionRate,
    };
  }

  // Converts numerical final score on 10-point scale to academic letter grade
  private convertToLetterGrade(score: number): string {
    if (score >= 8.5) return 'A';
    if (score >= 7.0) return 'B';
    if (score >= 5.5) return 'C';
    if (score >= 4.0) return 'D';
    return 'F';
  }

  // Converts numerical final score on 10-point scale to standard 4.0 GPA scale
  private convertToGpa4(score: number): number {
    const score4 = score * 0.4;
    const roudedScore4 = Math.round((score4 + Number.EPSILON) * 10) / 10;
    return roudedScore4;
  }
}
