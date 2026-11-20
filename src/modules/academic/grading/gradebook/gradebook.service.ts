import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import {
  EnrollmentStatus,
  GradeSourceType,
  Role,
} from 'src/generated/prisma/enums';
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
      ? Number((Math.round(weightedSum * 10000) / 10000).toFixed(4))
      : null;
    const letterGrade =
      finalScore !== null ? convertToLetterGrade(finalScore) : null;
    const gpa4 = finalScore !== null ? convertToGpa4(finalScore) : null;
    const isPassed = finalScore !== null ? finalScore >= 4.0 : null;

    // Step 5: Fetch classroom assignments, quizzes, and attendance records for detailed items
    const [assignments, publications] = await Promise.all([
      this.prisma.assignment.findMany({
        where: { classId },
        include: {
          submissions: {
            where: { studentId },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.quizPublication.findMany({
        where: { classId },
        include: {
          quiz: {
            include: {
              questions: { select: { points: true } },
            },
          },
          attempts: {
            where: {
              studentId,
              submittedAt: { not: null },
              score: { not: null },
            },
            orderBy: [{ score: 'desc' }, { submittedAt: 'desc' }],
            take: 1,
          },
        },
        orderBy: { publishedAt: 'desc' },
      }),
    ]);

    let submittedCount = 0;
    const detailedItems: DetailedGradeItemEntity[] = [];

    // Maps assignment items
    for (const a of assignments) {
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

      const maxScore = a.maxScore || 10;
      const rawScore = sub?.score ?? null;
      const earnedScore =
        rawScore !== null
          ? Math.round((rawScore / maxScore) * 10 * 10000) / 10000
          : null;

      detailedItems.push({
        id: a.id,
        title: a.title,
        type: 'assignment',
        maxScore: 10,
        rawScore,
        originalMaxScore: maxScore,
        earnedScore,
        status,
        feedback: sub?.feedback ?? null,
        submittedAt: sub?.submittedAt ? sub.submittedAt.toISOString() : null,
      });
    }

    // Maps quiz assessment items
    for (const pub of publications) {
      const bestAttempt = pub.attempts[0];
      const isAttempted = Boolean(bestAttempt);
      const isGraded =
        bestAttempt?.score !== null && bestAttempt?.score !== undefined;
      const status: 'graded' | 'pending' | 'unsubmitted' = isAttempted
        ? isGraded
          ? 'graded'
          : 'pending'
        : 'unsubmitted';

      if (isAttempted) {
        submittedCount += 1;
      }

      const totalQuizPoints =
        pub.quiz.questions?.reduce(
          (sum, q) => sum + (q.points && q.points > 0 ? q.points : 1),
          0,
        ) || 10;
      const rawScore = bestAttempt?.score ?? null;
      const earnedScore =
        rawScore !== null
          ? Math.round((rawScore / totalQuizPoints) * 10 * 10000) / 10000
          : null;

      detailedItems.push({
        id: pub.quizId,
        title: pub.quiz.title,
        type: 'quiz',
        maxScore: 10,
        rawScore,
        originalMaxScore: totalQuizPoints,
        earnedScore,
        status,
        feedback: bestAttempt ? 'Đã hoàn thành bài kiểm tra trắc nghiệm' : null,
        submittedAt: bestAttempt?.submittedAt
          ? bestAttempt.submittedAt.toISOString()
          : null,
      });
    }

    // Maps attendance evaluation item if attendance category exists
    const attendanceCat = categories.find(
      (c) => c.sourceType === GradeSourceType.attendance,
    );
    if (attendanceCat) {
      const attGrade = grades.find((g) => g.categoryId === attendanceCat.id);
      detailedItems.push({
        id: `att-${attendanceCat.id}`,
        title: attendanceCat.name,
        type: 'attendance',
        maxScore: 10,
        rawScore: attGrade?.rawScore ?? attGrade?.score ?? null,
        originalMaxScore: 10,
        earnedScore: attGrade?.score ?? null,
        status:
          attGrade?.score !== null && attGrade?.score !== undefined
            ? 'graded'
            : 'pending',
        feedback: attGrade?.isOverridden
          ? 'Giảng viên đã điều chỉnh trực tiếp'
          : 'Đánh giá quá trình tự động',
        submittedAt: null,
      });
    }

    const totalEvaluations =
      assignments.length + publications.length + (attendanceCat ? 1 : 0);
    const completionRate =
      totalEvaluations > 0
        ? Number(((submittedCount / totalEvaluations) * 100).toFixed(1))
        : 100;

    const attSummary = await computeClassAttendanceSummary(
      this.prisma,
      classId,
    );
    const attendanceSummary =
      attSummary.students.find((s) => s.studentId === studentId) ?? null;

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
      attendanceSummary,
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
