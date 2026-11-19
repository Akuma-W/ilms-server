import { GRADE_SCALE_TABLE } from '../../constants/grade-scale.constant';

export function convertToLetterGrade(score: number): string {
  for (const entry of GRADE_SCALE_TABLE) {
    if (score >= entry.minScore) {
      return entry.letter;
    }
  }
  return 'F';
}

export function convertToGpa4(score: number): number {
  const score4 = score * 0.4;
  return Math.round((score4 + Number.EPSILON) * 10) / 10;
}
