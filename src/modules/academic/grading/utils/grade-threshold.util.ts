import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import {
  GradeCategoryConfig,
  PillarWeightConfig,
} from '../interfaces/grade-category-config.interface';

// Determines threshold count based on integer count or percentage fallback
function getPillarThresholdCount(
  configMinRate: number | undefined,
  totalItems: number,
): number {
  if (!configMinRate || configMinRate <= 0) return 0;
  if (configMinRate <= totalItems) return configMinRate;
  if (totalItems <= 0) return 0;
  return Math.ceil((configMinRate / 100) * totalItems);
}

// Calculates pillar contribution score based on actual count, minimum threshold, and deduction policy
function calculatePillarScoreFromCounts(
  actualCount: number,
  totalItems: number,
  config?: PillarWeightConfig,
): { score: number; achieved: boolean; score10: number } {
  if (!config || config.weight <= 0) {
    return { score: 0, achieved: true, score10: 0 };
  }
  const threshold = getPillarThresholdCount(config.minRate, totalItems);

  if (threshold > 0) {
    const achieved = actualCount >= threshold;
    if (achieved) {
      return { score: config.weight * 10, achieved: true, score10: 10 };
    }
    if (config.strictThreshold) {
      return { score: 0, achieved: false, score10: 0 };
    }
    const scaledScore = (actualCount / threshold) * config.weight * 10;
    const score10 = Math.min(
      10,
      Math.round((actualCount / threshold) * 10 * 10000) / 10000,
    );
    return {
      score: Math.min(config.weight * 10, scaledScore),
      achieved: false,
      score10,
    };
  }

  // No threshold set: proportional to total items
  if (totalItems > 0) {
    const rate = Math.min(1, actualCount / totalItems);
    const score10 = Math.round(rate * 10 * 10000) / 10000;
    return { score: rate * config.weight * 10, achieved: true, score10 };
  }

  return { score: 0, achieved: false, score10: 0 };
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
    meetingScore10?: number;
    materialScore10?: number;
    assignmentScore10?: number;
    quizScore10?: number;
    thresholdPoints: number;
    directItemScore: number;
    counts: {
      totalMeetings: number;
      attendedMeetings: number;
      totalMaterials: number;
      readMaterials: number;
      totalAssignments: number;
      submittedAssignments: number;
      totalQuizzes: number;
      attemptedQuizzes: number;
    };
    rates: {
      meetingRate: number;
      materialRate: number;
      assignmentRate: number;
      quizRate: number;
    };
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
    const resMeet = calculatePillarScoreFromCounts(
      attendedMeetings,
      totalMeetings,
      config.pillars.meetings,
    );
    const resMat = calculatePillarScoreFromCounts(
      readMaterials,
      totalMaterials,
      config.pillars.materials,
    );
    const resAssign = calculatePillarScoreFromCounts(
      submittedAssignments,
      totalAssignments,
      config.pillars.assignments,
    );
    const resQuiz = calculatePillarScoreFromCounts(
      attemptedQuizzes,
      totalQuizzes,
      config.pillars.quizzes,
    );

    const scoreAccumulator =
      resMeet.score + resMat.score + resAssign.score + resQuiz.score;

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
      Math.round((scoreAccumulator + directItemsSum) * 10000) / 10000,
    );

    return {
      score: calculatedScore,
      breakdown: {
        meetingAchieved: resMeet.achieved,
        materialAchieved: resMat.achieved,
        assignmentAchieved: resAssign.achieved,
        quizAchieved: resQuiz.achieved,
        meetingScore10: resMeet.score10,
        materialScore10: resMat.score10,
        assignmentScore10: resAssign.score10,
        quizScore10: resQuiz.score10,
        thresholdPoints: scoreAccumulator,
        directItemScore: directItemsSum,
        counts: {
          totalMeetings,
          attendedMeetings,
          totalMaterials,
          readMaterials,
          totalAssignments,
          submittedAssignments,
          totalQuizzes,
          attemptedQuizzes,
        },
        rates: {
          meetingRate,
          materialRate,
          assignmentRate,
          quizRate,
        },
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
    Math.round((thresholdPoints + directItemScore) * 10000) / 10000,
  );

  return {
    score: finalScore,
    breakdown: {
      meetingAchieved,
      materialAchieved,
      assignmentAchieved,
      quizAchieved,
      meetingScore10: meetingAchieved ? 10 : 0,
      materialScore10: materialAchieved ? 10 : 0,
      assignmentScore10: assignmentAchieved ? 10 : 0,
      quizScore10: quizAchieved ? 10 : 0,
      thresholdPoints,
      directItemScore,
      counts: {
        totalMeetings,
        attendedMeetings,
        totalMaterials,
        readMaterials,
        totalAssignments,
        submittedAssignments,
        totalQuizzes,
        attemptedQuizzes,
      },
      rates: {
        meetingRate,
        materialRate,
        assignmentRate,
        quizRate,
      },
    },
  };
}
