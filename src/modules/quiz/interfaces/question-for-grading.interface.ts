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
