import { QuizOptionSummary } from './quiz-option-summary.interface';

export interface QuizQuestionSummary {
  id: string;
  content: string;
  questionType: string;
  points: number | null;
  orderIndex: number | null;
  explanation: string | null;
  options: QuizOptionSummary[];
}
