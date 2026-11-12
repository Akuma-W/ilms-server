import { QuestionGradingDetail } from '../../interfaces/question-grading-detail.interface';

export interface SubmittedAttemptResult {
  attemptId: string;
  quizId: string;
  score: number;
  totalQuestions: number;
  correctCount: number;
  submittedAt: Date;
  details: Array<
    QuestionGradingDetail & {
      selectedOptionIds: string[];
      correctOptionIds: string[];
    }
  >;
}
