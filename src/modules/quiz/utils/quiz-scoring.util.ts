import {
  AttemptForStats,
  ClassQuizStatsResult,
  QuestionForGrading,
  QuestionGradingDetail,
  QuizScoringResult,
  StudentForStats,
  SubmissionAnswerItem,
} from '../interfaces';

// Grade quiz submission answers and calculate scaled score on a 10-point scale
export function gradeQuizSubmission(
  questions: QuestionForGrading[],
  submittedAnswers: SubmissionAnswerItem[],
): QuizScoringResult {
  const answerMap = new Map<string, string[]>();
  for (const ans of submittedAnswers) {
    answerMap.set(ans.questionId, ans.selectedOptionIds || []);
  }

  let totalMaxPoints = 0;
  let totalPointsEarned = 0;
  let correctCount = 0;
  const details: QuestionGradingDetail[] = [];

  for (const question of questions) {
    const maxPoints =
      question.points && question.points > 0 ? question.points : 1;
    totalMaxPoints += maxPoints;

    const selectedOptionIds = answerMap.get(question.id) || [];
    const correctOptionIds = question.options
      .filter((opt) => opt.isCorrect)
      .map((opt) => opt.id);

    let isCorrect = false;

    if (question.questionType === 'multiple_select') {
      const hasAllCorrect =
        correctOptionIds.length > 0 &&
        correctOptionIds.every((id) => selectedOptionIds.includes(id));
      const hasNoIncorrect = selectedOptionIds.every((id) =>
        correctOptionIds.includes(id),
      );
      isCorrect = hasAllCorrect && hasNoIncorrect;
    } else {
      isCorrect =
        selectedOptionIds.length === 1 &&
        correctOptionIds.includes(selectedOptionIds[0]);
    }

    const pointsEarned = isCorrect ? maxPoints : 0;
    if (isCorrect) {
      correctCount += 1;
      totalPointsEarned += pointsEarned;
    }

    details.push({
      questionId: question.id,
      isCorrect,
      pointsEarned,
      maxPoints,
      explanation: question.explanation,
    });
  }

  const rawScore =
    totalMaxPoints > 0 ? (totalPointsEarned / totalMaxPoints) * 10 : 0;
  const score = Math.round(rawScore * 10) / 10;

  return {
    score,
    totalQuestions: questions.length,
    correctCount,
    details,
  };
}

// Calculate grade distribution and score metrics for classroom quiz publication
export function calculateClassQuizPerformance(
  publicationId: string,
  students: StudentForStats[],
  attempts: AttemptForStats[],
): ClassQuizStatsResult {
  const totalStudents = students.length;

  const studentAttemptMap = new Map<string, AttemptForStats>();
  for (const att of attempts) {
    if (!studentAttemptMap.has(att.studentId)) {
      studentAttemptMap.set(att.studentId, att);
    }
  }

  let submittedCount = 0;
  let scoreSum = 0;
  let highestScore: number | null = null;
  let lowestScore: number | null = null;

  const distribution = {
    under5: 0,
    from5To6_5: 0,
    from6_5To8: 0,
    from8To10: 0,
  };

  const studentRows = students.map((s) => {
    const att = studentAttemptMap.get(s.id);
    const isSubmitted = !!att;
    const score = att?.score ?? null;

    if (isSubmitted && score !== null) {
      submittedCount += 1;
      scoreSum += score;
      if (highestScore === null || score > highestScore) highestScore = score;
      if (lowestScore === null || score < lowestScore) lowestScore = score;

      if (score < 5.0) distribution.under5 += 1;
      else if (score < 6.5) distribution.from5To6_5 += 1;
      else if (score < 8.0) distribution.from6_5To8 += 1;
      else distribution.from8To10 += 1;
    }

    return {
      studentId: s.id,
      name: s.fullName,
      email: s.email,
      avatar: s.avatarUrl,
      isSubmitted,
      score,
      startedAt: att?.startedAt ?? null,
      submittedAt: att?.submittedAt ?? null,
      attemptId: att?.id ?? null,
    };
  });

  const averageScore =
    submittedCount > 0 ? Math.round((scoreSum / submittedCount) * 10) / 10 : 0;

  return {
    publicationId,
    totalStudents,
    submittedCount,
    notSubmittedCount: totalStudents - submittedCount,
    averageScore,
    highestScore,
    lowestScore,
    distribution,
    students: studentRows,
  };
}
