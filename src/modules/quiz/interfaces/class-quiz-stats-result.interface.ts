export interface StudentForStats {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
}

export interface AttemptForStats {
  id: string;
  studentId: string;
  score: number | null;
  startedAt: Date;
  submittedAt: Date | null;
}

interface ClassQuizStudentScoreRow {
  studentId: string;
  name: string;
  email: string;
  avatar: string | null;
  isSubmitted: boolean;
  score: number | null;
  startedAt: Date | null;
  submittedAt: Date | null;
  attemptId: string | null;
}

interface ClassQuizStatsDistribution {
  under5: number;
  from5To6_5: number;
  from6_5To8: number;
  from8To10: number;
}

export interface ClassQuizStatsResult {
  publicationId: string;
  totalStudents: number;
  submittedCount: number;
  notSubmittedCount: number;
  averageScore: number;
  highestScore: number | null;
  lowestScore: number | null;
  distribution: ClassQuizStatsDistribution;
  students: ClassQuizStudentScoreRow[];
}
