import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import {
  GradeCategoryConfig,
  PillarWeightConfig,
} from '../interfaces/grade-category-config.interface';

// Calculates pillar contribution score based on completion rate, minimum threshold, and deduction policy
function calculatePillarScore(
  completionRate: number,
  config?: PillarWeightConfig,
): number {
  if (!config) return 0;
  const minRate = config.minRate ?? 0;

  if (minRate > 0) {
    if (completionRate >= minRate) {
      return config.weight * 10;
    }
    if (config.strictThreshold) {
      return 0;
    }
    return (completionRate / minRate) * config.weight * 10;
  }

  return (completionRate / 100) * config.weight * 10;
}

// Evaluates attendance threshold criteria and calculates direct item contribution
export async function computeThresholdAttendanceScore(
  prisma: PrismaService,
  classId: string,
  studentId: string,
  config: GradeCategoryConfig,
): Promise<{
  score: number;
  breakdown: {
    meetingAchieved: boolean;
    materialAchieved: boolean;
    assignmentAchieved: boolean;
    quizAchieved: boolean;
    thresholdPoints: number;
    directItemScore: number;
  };
}> {
  // 1. Evaluate Meeting Attendance rate
  const totalMeetings = await prisma.meetingSession.count({
    where: { classId },
  });
  const attendedMeetings =
    totalMeetings > 0
      ? await prisma.meetingAttendance.count({
          where: { classId, studentId },
        })
      : 0;
  const meetingRate =
    totalMeetings > 0 ? (attendedMeetings / totalMeetings) * 100 : 100;

  // 2. Evaluate Material Reading rate
  const totalMaterials = await prisma.material.count({
    where: { topic: { classId } },
  });
  const readMaterials =
    totalMaterials > 0
      ? await prisma.materialProgress.count({
          where: { studentId, material: { topic: { classId } } },
        })
      : 0;
  const materialRate =
    totalMaterials > 0 ? (readMaterials / totalMaterials) * 100 : 100;

  // 3. Evaluate Assignment Submission rate
  const totalAssignments = await prisma.assignment.count({
    where: { classId },
  });
  const submittedAssignments =
    totalAssignments > 0
      ? await prisma.submission.count({
          where: { studentId, assignment: { classId } },
        })
      : 0;
  const assignmentRate =
    totalAssignments > 0
      ? (submittedAssignments / totalAssignments) * 100
      : 100;

  // 4. Evaluate Quiz Attempt rate
  const totalQuizzes = await prisma.quizPublication.count({
    where: { classId },
  });
  const attemptedQuizzes =
    totalQuizzes > 0
      ? await prisma.quizAttempt.count({
          where: {
            studentId,
            publication: { classId },
            submittedAt: { not: null },
          },
        })
      : 0;
  const quizRate =
    totalQuizzes > 0 ? (attemptedQuizzes / totalQuizzes) * 100 : 100;

  // Check whether modern 4-pillar weighting schema is configured
  if (config.pillars) {
    let scoreAccumulator = 0;
    scoreAccumulator += calculatePillarScore(
      meetingRate,
      config.pillars.meetings,
    );
    scoreAccumulator += calculatePillarScore(
      materialRate,
      config.pillars.materials,
    );
    scoreAccumulator += calculatePillarScore(
      assignmentRate,
      config.pillars.assignments,
    );
    scoreAccumulator += calculatePillarScore(quizRate, config.pillars.quizzes);

    // Evaluate modern multiple direct items
    let directItemsSum = 0;
    if (config.directItems && config.directItems.length > 0) {
      for (const item of config.directItems) {
        if (item.type === 'assignment') {
          const sub = await prisma.submission.findFirst({
            where: { assignmentId: item.id, studentId },
            select: { score: true },
          });
          const assignment = await prisma.assignment.findUnique({
            where: { id: item.id },
            select: { maxScore: true },
          });
          const raw = sub?.score || 0;
          const max = assignment?.maxScore || 10;
          const normalized = (raw / max) * 10;
          directItemsSum += normalized * item.weight;
        } else if (item.type === 'quiz') {
          const attempt = await prisma.quizAttempt.findFirst({
            where: {
              publicationId: item.id,
              studentId,
              submittedAt: { not: null },
            },
            orderBy: { score: 'desc' },
            select: { score: true },
          });
          const raw = attempt?.score || 0;
          directItemsSum += raw * item.weight;
        }
      }
    }

    const calculatedScore = Math.min(
      10,
      Math.round((scoreAccumulator + directItemsSum) * 10) / 10,
    );

    return {
      score: calculatedScore,
      breakdown: {
        meetingAchieved: meetingRate >= (config.pillars.meetings?.minRate ?? 0),
        materialAchieved:
          materialRate >= (config.pillars.materials?.minRate ?? 0),
        assignmentAchieved:
          assignmentRate >= (config.pillars.assignments?.minRate ?? 0),
        quizAchieved: quizRate >= (config.pillars.quizzes?.minRate ?? 0),
        thresholdPoints: scoreAccumulator,
        directItemScore: directItemsSum,
      },
    };
  }

  // Legacy fallback: static points thresholds
  const defaultThreshold = { minRate: 80, points: 1.0 };
  const meetingConf = config.thresholds?.meeting || defaultThreshold;
  const materialConf = config.thresholds?.material || defaultThreshold;
  const assignmentConf = config.thresholds?.assignment || defaultThreshold;
  const quizConf = config.thresholds?.quiz || defaultThreshold;

  const meetingAchieved = meetingRate >= meetingConf.minRate;
  const materialAchieved = materialRate >= materialConf.minRate;
  const assignmentAchieved = assignmentRate >= assignmentConf.minRate;
  const quizAchieved = quizRate >= quizConf.minRate;

  let thresholdPoints = 0;
  if (meetingAchieved) thresholdPoints += meetingConf.points;
  if (materialAchieved) thresholdPoints += materialConf.points;
  if (assignmentAchieved) thresholdPoints += assignmentConf.points;
  if (quizAchieved) thresholdPoints += quizConf.points;

  let directItemScore = 0;
  if (config.directItem?.id) {
    if (config.directItem.type === 'assignment') {
      const sub = await prisma.submission.findFirst({
        where: { assignmentId: config.directItem.id, studentId },
        select: { score: true },
      });
      const assignment = await prisma.assignment.findUnique({
        where: { id: config.directItem.id },
        select: { maxScore: true },
      });
      const raw = sub?.score || 0;
      const max = assignment?.maxScore || 10;
      const normalizedScore = (raw / max) * 10;
      directItemScore = normalizedScore * (config.directItem.weight || 0.6);
    }
  }

  const finalScore = Math.min(
    10,
    Math.round((thresholdPoints + directItemScore) * 10) / 10,
  );

  return {
    score: finalScore,
    breakdown: {
      meetingAchieved,
      materialAchieved,
      assignmentAchieved,
      quizAchieved,
      thresholdPoints,
      directItemScore,
    },
  };
}
