export interface QuestionForGrading {
  id: string;
  points: number | null;
  questionType: string;
  explanation: string | null;
  options: Array<{
    id: string;
    isCorrect: boolean;
  }>;
}

export interface SubmissionAnswerItem {
  questionId: string;
  selectedOptionIds: string[];
}

export interface QuestionGradingDetail {
  questionId: string;
  isCorrect: boolean;
  pointsEarned: number;
  maxPoints: number;
  explanation: string | null;
}

export interface QuizScoringResult {
  score: number;
  totalQuestions: number;
  correctCount: number;
  details: QuestionGradingDetail[];
}
