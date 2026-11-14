interface QuestionResultDetail {
  questionId: string;
  isCorrect: boolean;
  pointsEarned: number;
  maxPoints: number;
  explanation: string | null;
  selectedOptionIds: string[];
  correctOptionIds: string[];
}

interface TakeQuizSessionQuestion {
  id: string;
  content: string;
  questionType: string;
  points: number | null;
  orderIndex: number | null;
  options: Array<{
    id: string;
    content: string;
  }>;
}

export interface TakeQuizSessionResult {
  attemptId: string;
  quizId: string;
  title: string;
  timeLimit: number;
  startedAt: Date;
  publicationId?: string | null;
  questions: TakeQuizSessionQuestion[];
}

export interface SubmittedAttemptResult {
  attemptId: string;
  quizId: string;
  score: number;
  totalQuestions: number;
  correctCount: number;
  submittedAt: Date;
  details: QuestionResultDetail[];
}

export interface AttemptReviewResult {
  attemptId: string;
  quizId: string;
  title: string;
  studentId: string;
  publicationId: string | null;
  score: number | null;
  startedAt: Date;
  submittedAt: Date | null;
  totalQuestions: number;
  correctCount: number;
  details: QuestionResultDetail[];
}

export interface UserPastAttemptSummary {
  id: string;
  quizId: string;
  publicationId: string | null;
  score: number | null;
  startedAt: Date;
  submittedAt: Date | null;
}
