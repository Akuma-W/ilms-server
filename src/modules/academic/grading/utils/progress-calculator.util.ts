import { EnrollmentStatus, Role } from 'src/generated/prisma/enums';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { CalculateAttendanceDto } from '../calculations/dto/calculate-attendance.dto';
import { AttendanceStudentItemEntity } from '../gradebook/entities/attendance-student-item.entity';
import { AttendanceSummaryEntity } from '../gradebook/entities/attendance-summary.entity';
import { GradeCategoryConfig } from '../interfaces/grade-category-config.interface';
import { resolveAttendanceCategory } from './attendance-category-resolver.util';

export { resolveAttendanceCategory };

export async function computeClassAttendanceSummary(
  prisma: PrismaService,
  classId: string,
  dto?: CalculateAttendanceDto,
): Promise<AttendanceSummaryEntity> {
  let category: { id: string; name: string; config: unknown } | null = null;
  try {
    category = await resolveAttendanceCategory(
      prisma,
      classId,
      dto?.categoryId,
    );
  } catch {
    category = null;
  }

  const categoryId = category?.id ?? '';

  // Resolves configured weights from dto or category.config
  const catConfig = category?.config as GradeCategoryConfig | null;
  const materialWeight =
    dto?.materialWeight ??
    catConfig?.pillars?.materials?.weight ??
    catConfig?.materialWeight ??
    0.25;
  const meetingWeight =
    dto?.meetingWeight ??
    catConfig?.pillars?.meetings?.weight ??
    catConfig?.meetingWeight ??
    0.25;
  const assignmentWeight =
    dto?.assignmentWeight ?? catConfig?.pillars?.assignments?.weight ?? 0.25;
  const quizWeight =
    dto?.quizWeight ?? catConfig?.pillars?.quizzes?.weight ?? 0.25;

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

  // Counts total assignments in the class
  const totalAssignments = await prisma.assignment.count({
    where: { classId },
  });

  // Counts total published quizzes in the class
  const totalQuizzes = await prisma.quizPublication.count({
    where: { classId },
  });

  // Fetches meeting sessions designated for official attendance
  const gradedMeetings = await prisma.meetingSession.findMany({
    where: { classId, isGraded: true },
    select: { id: true, startTime: true },
  });
  const sessionDaySet = new Set(
    gradedMeetings.map((m) => m.startTime.toISOString().slice(0, 10)),
  );
  const totalSessions = sessionDaySet.size;

  // Fetches all meeting attendance records for official graded meetings
  const attendances = await prisma.meetingAttendance.findMany({
    where: {
      classId,
      session: { isGraded: true },
    },
    select: {
      studentId: true,
      joinedAt: true,
    },
  });

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

  // Fetches assignment submissions in this class
  const submissions = await prisma.submission.findMany({
    where: {
      assignment: { classId },
    },
    select: {
      studentId: true,
      assignmentId: true,
    },
  });

  // Fetches quiz attempts in this class
  const attempts = await prisma.quizAttempt.findMany({
    where: {
      publication: { classId },
      submittedAt: { not: null },
    },
    select: {
      studentId: true,
      publicationId: true,
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

  // Maps student submitted distinct assignments
  const studentSubmissionMap = new Map<string, Set<string>>();
  for (const s of submissions) {
    if (!studentSubmissionMap.has(s.studentId)) {
      studentSubmissionMap.set(s.studentId, new Set());
    }
    studentSubmissionMap.get(s.studentId)!.add(s.assignmentId);
  }

  // Maps student attempted distinct quizzes
  const studentQuizMap = new Map<string, Set<string>>();
  for (const at of attempts) {
    if (at.publicationId) {
      if (!studentQuizMap.has(at.studentId)) {
        studentQuizMap.set(at.studentId, new Set());
      }
      studentQuizMap.get(at.studentId)!.add(at.publicationId);
    }
  }

  // Fetches existing grades for this category
  const existingGrades = categoryId
    ? await prisma.grade.findMany({
        where: { categoryId },
        select: { studentId: true, score: true },
      })
    : [];
  const currentGradeMap = new Map(
    existingGrades.map((g) => [g.studentId, g.score]),
  );

  // Threshold criteria configuration (supports integer threshold or minRate percentage)
  let meetingThreshold =
    dto?.meetingThreshold ?? catConfig?.pillars?.meetings?.minRate ?? 0;
  if (!dto?.meetingThreshold && dto?.meetingMinRate && dto.meetingMinRate > 0) {
    meetingThreshold =
      dto.meetingMinRate <= 1.0
        ? Math.ceil(dto.meetingMinRate * totalSessions)
        : Math.ceil((dto.meetingMinRate / 100) * totalSessions);
  }

  let materialThreshold =
    dto?.materialThreshold ?? catConfig?.pillars?.materials?.minRate ?? 0;
  if (
    !dto?.materialThreshold &&
    dto?.materialMinRate &&
    dto.materialMinRate > 0
  ) {
    materialThreshold =
      dto.materialMinRate <= 1.0
        ? Math.ceil(dto.materialMinRate * totalMaterials)
        : Math.ceil((dto.materialMinRate / 100) * totalMaterials);
  }

  const assignmentThreshold =
    dto?.assignmentThreshold ?? catConfig?.pillars?.assignments?.minRate ?? 0;

  const quizThreshold =
    dto?.quizThreshold ?? catConfig?.pillars?.quizzes?.minRate ?? 0;

  // Calculates scores for each student
  const students: AttendanceStudentItemEntity[] = enrollments.map((e) => {
    const sId = e.user.id;
    const completedCount = studentCompletedMap.get(sId) ?? 0;
    const attendedCount = studentSessionMap.get(sId)?.size ?? 0;
    const submittedCount = studentSubmissionMap.get(sId)?.size ?? 0;
    const attemptedCount = studentQuizMap.get(sId)?.size ?? 0;

    const materialRate =
      totalMaterials > 0
        ? Math.min(100, Math.round((completedCount / totalMaterials) * 100))
        : 100;
    const sessionRate =
      totalSessions > 0
        ? Math.min(100, Math.round((attendedCount / totalSessions) * 100))
        : 100;
    const assignmentRate =
      totalAssignments > 0
        ? Math.min(100, Math.round((submittedCount / totalAssignments) * 100))
        : 100;
    const quizRate =
      totalQuizzes > 0
        ? Math.min(100, Math.round((attemptedCount / totalQuizzes) * 100))
        : 100;

    // Component score evaluation on 10-point scale
    const sMeet =
      meetingThreshold > 0
        ? attendedCount >= meetingThreshold
          ? 10
          : Math.min(10, (attendedCount / meetingThreshold) * 10)
        : totalSessions > 0
          ? Math.min(10, (attendedCount / totalSessions) * 10)
          : 10;

    const sMat =
      materialThreshold > 0
        ? completedCount >= materialThreshold
          ? 10
          : Math.min(10, (completedCount / materialThreshold) * 10)
        : totalMaterials > 0
          ? Math.min(10, (completedCount / totalMaterials) * 10)
          : 10;

    const sAssign =
      assignmentThreshold > 0
        ? submittedCount >= assignmentThreshold
          ? 10
          : Math.min(10, (submittedCount / assignmentThreshold) * 10)
        : totalAssignments > 0
          ? Math.min(10, (submittedCount / totalAssignments) * 10)
          : 10;

    const sQuiz =
      quizThreshold > 0
        ? attemptedCount >= quizThreshold
          ? 10
          : Math.min(10, (attemptedCount / quizThreshold) * 10)
        : totalQuizzes > 0
          ? Math.min(10, (attemptedCount / totalQuizzes) * 10)
          : 10;

    const totalW =
      (meetingWeight > 0 ? meetingWeight : 0) +
        (materialWeight > 0 ? materialWeight : 0) +
        (assignmentWeight > 0 ? assignmentWeight : 0) +
        (quizWeight > 0 ? quizWeight : 0) || 1.0;

    const weightedScore =
      ((meetingWeight > 0 ? meetingWeight * sMeet : 0) +
        (materialWeight > 0 ? materialWeight * sMat : 0) +
        (assignmentWeight > 0 ? assignmentWeight * sAssign : 0) +
        (quizWeight > 0 ? quizWeight * sQuiz : 0)) /
      totalW;

    const calculatedScore = Math.min(10, Math.round(weightedScore * 10) / 10);

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
      submittedAssignments: submittedCount,
      totalAssignments,
      assignmentRate,
      attemptedQuizzes: attemptedCount,
      totalQuizzes,
      quizRate,
      calculatedScore,
      currentScore: currentGradeMap.get(sId) ?? null,
    };
  });

  return {
    totalMaterials,
    totalSessions,
    totalAssignments,
    totalQuizzes,
    materialWeight,
    meetingWeight,
    assignmentWeight,
    quizWeight,
    categoryId,
    students,
  };
}
