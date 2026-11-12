export interface AttemptForStats {
  id: string;
  studentId: string;
  score: number | null;
  startedAt: Date;
  submittedAt: Date | null;
}
