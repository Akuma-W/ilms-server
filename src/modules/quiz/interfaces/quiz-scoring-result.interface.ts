import { QuestionGradingDetail } from './question-grading-detail.interface';

export interface QuizScoringResult {
  score: number;
  totalQuestions: number;
  correctCount: number;
  details: QuestionGradingDetail[];
}
