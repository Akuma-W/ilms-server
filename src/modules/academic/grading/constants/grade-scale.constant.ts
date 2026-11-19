interface GradeScaleEntry {
  minScore: number;
  letter: string;
}

export const GRADE_SCALE_TABLE: GradeScaleEntry[] = [
  { minScore: 8.5, letter: 'A' },
  { minScore: 7.0, letter: 'B' },
  { minScore: 5.5, letter: 'C' },
  { minScore: 4.0, letter: 'D' },
  { minScore: 0.0, letter: 'F' },
];
