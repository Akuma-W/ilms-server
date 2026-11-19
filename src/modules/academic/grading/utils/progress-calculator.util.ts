import { NotFoundException } from '@nestjs/common';
import {
  EnrollmentStatus,
  GradeSourceType,
  Role,
} from 'src/generated/prisma/enums';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { CalculateAttendanceDto } from '../calculations/dto/calculate-attendance.dto';
import { AttendanceStudentItemEntity } from '../gradebook/entities/attendance-student-item.entity';
import { AttendanceSummaryEntity } from '../gradebook/entities/attendance-summary.entity';
import { GradeCalculationStrategy } from '../constants/grade-strategy.constant';
import { GradeCategoryConfig } from '../interfaces/grade-category-config.interface';
import { computeThresholdAttendanceScore } from './grade-threshold.util';

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

export async function computeClassAttendanceSummary(
  prisma: PrismaService,
  classId: string,
  dto?: CalculateAttendanceDto,
): Promise<AttendanceSummaryEntity> {
  const category = await resolveAttendanceCategory(
    prisma,
    classId,
    dto?.categoryId,
  );

  // Resolves configured weights from dto or category.config
  const catConfig = category.config as GradeCategoryConfig | null;
  const materialWeight =
    dto?.materialWeight ?? catConfig?.materialWeight ?? 0.5;
  const meetingWeight = dto?.meetingWeight ?? catConfig?.meetingWeight ?? 0.5;

  // Fetches approved enrolled students
  const enrollments = await prisma.enrollment.findMany({
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

  // Counts total available materials in the class
  const totalMaterials = await prisma.material.count({
    where: {
      topic: { classId },
    },
  });

  // Fetches all meeting attendance records
  const attendances = await prisma.meetingAttendance.findMany({
    where: { classId },
    select: {
      studentId: true,
      joinedAt: true,
    },
  });

  // Determines distinct meeting dates as official sessions
  const sessionDaySet = new Set(
    attendances.map((a) => a.joinedAt.toISOString().slice(0, 10)),
  );
  const totalSessions = sessionDaySet.size;

  // Fetches completed material progress records
  const progresses = await prisma.materialProgress.findMany({
    where: {
      isCompleted: true,
      material: { topic: { classId } },
    },
    select: {
      studentId: true,
      materialId: true,
    },
  });

  // Maps student completed material counts
  const studentCompletedMap = new Map<string, number>();
  for (const p of progresses) {
    const current = studentCompletedMap.get(p.studentId) ?? 0;
    studentCompletedMap.set(p.studentId, current + 1);
  }

  // Maps student attended distinct session dates
  const studentSessionMap = new Map<string, Set<string>>();
  for (const a of attendances) {
    if (!studentSessionMap.has(a.studentId)) {
      studentSessionMap.set(a.studentId, new Set());
    }
    studentSessionMap
      .get(a.studentId)!
      .add(a.joinedAt.toISOString().slice(0, 10));
  }

  // Fetches existing grades for this category
  const existingGrades = await prisma.grade.findMany({
    where: { categoryId: category.id },
    select: { studentId: true, score: true },
  });
  const currentGradeMap = new Map(
    existingGrades.map((g) => [g.studentId, g.score]),
  );

  // Calculates scores for each student
  const students: AttendanceStudentItemEntity[] = await Promise.all(
    enrollments.map(async (e) => {
      const sId = e.user.id;
      const completedCount = studentCompletedMap.get(sId) ?? 0;
      const attendedCount = studentSessionMap.get(sId)?.size ?? 0;

      const materialRate =
        totalMaterials > 0
          ? Math.min(100, Math.round((completedCount / totalMaterials) * 100))
          : 100;
      const sessionRate =
        totalSessions > 0
          ? Math.min(100, Math.round((attendedCount / totalSessions) * 100))
          : 100;

      const pMat = materialRate / 100;
      const pMeet = sessionRate / 100;

      const totalW = materialWeight + meetingWeight || 1.0;
      const normalizedWMat = materialWeight / totalW;
      const normalizedWMeet = meetingWeight / totalW;

      let calculatedScore =
        Math.round(
          (normalizedWMat * pMat + normalizedWMeet * pMeet) * 10.0 * 10,
        ) / 10;

      // Evaluates unified 4-pillar or threshold checklist strategy if configured
      if (
        catConfig &&
        (catConfig.pillars ||
          catConfig.strategy === GradeCalculationStrategy.progressUnified ||
          catConfig.strategy === GradeCalculationStrategy.attendanceThreshold)
      ) {
        const thresholdRes = await computeThresholdAttendanceScore(
          prisma,
          classId,
          sId,
          catConfig,
        );
        calculatedScore = thresholdRes.score;
      }

      return {
        studentId: sId,
        studentName: e.user.fullName,
        studentEmail: e.user.email,
        studentCode: e.user.identityCode ?? `SV-${sId.substring(0, 6)}`,
        avatarUrl: e.user.avatarUrl,
        completedMaterials: completedCount,
        totalMaterials,
        materialRate,
        attendedSessions: attendedCount,
        totalSessions,
        sessionRate,
        calculatedScore,
        currentScore: currentGradeMap.get(sId) ?? null,
      };
    }),
  );

  return {
    totalMaterials,
    totalSessions,
    materialWeight,
    meetingWeight,
    categoryId: category.id,
    students,
  };
}
