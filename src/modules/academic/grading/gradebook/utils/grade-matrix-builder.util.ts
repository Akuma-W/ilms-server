import { GradeCategoryEntity } from '../../categories/entities/grade-category.entity';
import { convertToGpa4, convertToLetterGrade } from './grade-scale.util';

export function buildGradeMatrixRowsAndKpis(
  categories: GradeCategoryEntity[],
  enrollments: Array<{
    user: {
      id: string;
      fullName: string;
      email: string;
      identityCode?: string | null;
      avatarUrl?: string | null;
    };
  }>,
  grades: Array<{ studentId: string; categoryId: string; score: number }>,
) {
  const studentScoreMap = new Map<string, Map<string, number>>();
  for (const g of grades) {
    if (!studentScoreMap.has(g.studentId)) {
      studentScoreMap.set(g.studentId, new Map());
    }
    studentScoreMap.get(g.studentId)!.set(g.categoryId, g.score);
  }

  const rows = enrollments.map((e) => {
    const studentId = e.user.id;
    const scores: Record<string, number | null> = {};
    let weightedSum = 0;
    let hasAnyScore = false;

    for (const cat of categories) {
      const score = studentScoreMap.get(studentId)?.get(cat.id) ?? null;
      scores[cat.id] = score;
      if (score !== null) {
        weightedSum += score * cat.weight;
        hasAnyScore = true;
      }
    }

    const finalScore = hasAnyScore
      ? Number((Math.round(weightedSum * 10) / 10).toFixed(1))
      : null;
    const letterGrade =
      finalScore !== null ? convertToLetterGrade(finalScore) : null;
    const gpa4 = finalScore !== null ? convertToGpa4(finalScore) : null;

    return {
      studentId,
      studentName: e.user.fullName,
      studentEmail: e.user.email,
      studentCode: e.user.identityCode ?? `SV-${studentId.substring(0, 6)}`,
      avatarUrl: e.user.avatarUrl,
      scores,
      finalScore,
      gpa4,
      letterGrade,
    };
  });

  const totalStudents = rows.length;
  const gradedRows = rows.filter((r) => r.finalScore !== null);
  const totalGraded = gradedRows.length;
  const passingStudents = gradedRows.filter(
    (r) => (r.finalScore ?? 0) >= 5.0,
  ).length;
  const averageScore =
    totalGraded > 0
      ? (
          gradedRows.reduce((sum, r) => sum + (r.finalScore ?? 0), 0) /
          totalGraded
        ).toFixed(2)
      : '-';
  const passingRate =
    totalGraded > 0
      ? Number(((passingStudents / totalGraded) * 100).toFixed(1))
      : 0;

  return {
    categories,
    rows,
    totalStudents,
    averageScore,
    passingRate,
  };
}
