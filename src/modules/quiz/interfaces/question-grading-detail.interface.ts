export interface QuestionGradingDetail {
  questionId: string;
  isCorrect: boolean;
  pointsEarned: number;
  maxPoints: number;
  explanation: string | null;
}
