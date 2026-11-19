import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { EnrollmentStatus, Role } from 'src/generated/prisma/enums';
import { checkTeacherPermission } from '../../utils/academic-permission.util';
import { CategoriesService } from '../categories/categories.service';
import { ClassGradeMatrixEntity } from './entities/grade-matrix.entity';
import { AttendanceSummaryEntity } from './entities/attendance-summary.entity';
import { GradeCategoryBreakdownEntity } from './entities/grade-category-breakdown.entity';
import { StudentCategoryGradeEntity } from './entities/student-category-grade.entity';
import { DetailedGradeItemEntity } from './entities/detailed-grade-item.entity';
import { GradeRecordEntity } from './entities/grade-record.entity';
import { buildGradeMatrixRowsAndKpis } from './utils/grade-matrix-builder.util';
import { convertToGpa4, convertToLetterGrade } from './utils/grade-scale.util';
import { buildCategoryBreakdown } from './utils/grade-breakdown-builder.util';
import { computeClassAttendanceSummary } from '../utils/progress-calculator.util';

@Injectable()
export class GradebookService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly categoriesService: CategoriesService,
  ) {}

  // Retrieves the full class grade matrix and calculates KPI stats for teacher/admin view
  async getGradeMatrix(classId: string): Promise<ClassGradeMatrixEntity> {
    // Step 1: Auto-initialize standard 3 categories (20/30/50%) if none exist
    await this.categoriesService.ensureDefaultCategories(classId);

    // Step 2: Fetch categories ordered by sequence index
    const categories = await this.prisma.gradeCategory.findMany({
      where: { classId },
      orderBy: { orderIndex: 'asc' },
    });

    // Step 3: Fetch all approved students enrolled in this classroom
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

    // Step 4: Fetch all existing grades for this class
    const grades = await this.prisma.grade.findMany({
      where: {
        category: { classId },
      },
    });

    // Step 5: Build matrix rows and KPIs using specialized builder util
    return buildGradeMatrixRowsAndKpis(categories, enrollments, grades);
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
    await this.categoriesService.ensureDefaultCategories(classId);
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
      finalScore !== null ? convertToLetterGrade(finalScore) : null;
    const gpa4 = finalScore !== null ? convertToGpa4(finalScore) : null;
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
        ? Number(((submittedCount / assignments.length) * 100).toFixed(1))
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
      letterGrade,
      gpa4,
      isPassed,
      completionRate,
    };
  }

  // Returns attendance summary and predicted scores for teacher inspection
  async getAttendanceSummary(
    classId: string,
    categoryId?: string,
  ): Promise<AttendanceSummaryEntity> {
    return computeClassAttendanceSummary(this.prisma, classId, { categoryId });
  }

  // Returns granular sub-scores and component items contributing to category score
  async getCategoryBreakdown(
    classId: string,
    categoryId: string,
    studentId: string,
  ): Promise<GradeCategoryBreakdownEntity> {
    return buildCategoryBreakdown(this.prisma, classId, categoryId, studentId);
  }
}
