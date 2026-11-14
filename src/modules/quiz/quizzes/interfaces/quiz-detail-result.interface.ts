import { QuizQuestionSummary } from './quiz-question-summary.interface';

export interface QuizDetailResult {
  id: string;
  title: string;
  description: string | null;
  timeLimit: number;
  visibility: string;
  status: string;
  createdBy: string;
  createdAt: Date | null;
  updatedAt: Date | null;
  totalPoints?: number;
  totalQuestions?: number;
  creator?: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
  } | null;
  questions: QuizQuestionSummary[];
}
