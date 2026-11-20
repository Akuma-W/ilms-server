import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StudentCategoryGradeEntity } from './student-category-grade.entity';
import { DetailedGradeItemEntity } from './detailed-grade-item.entity';
import { AttendanceStudentItemEntity } from './attendance-student-item.entity';

export class GradeRecordEntity {
  @ApiProperty({
    description: 'Student UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: 'string',
  })
  studentId!: string;

  @ApiProperty({
    description: 'Student full name',
    example: 'John Doe',
    type: 'string',
  })
  studentName!: string;

  @ApiProperty({
    description: 'Student email address',
    example: 'student.a@example.edu.vn',
    type: 'string',
  })
  studentEmail!: string;

  @ApiPropertyOptional({
    description: 'Student code',
    example: 'SV2026-001',
    type: 'string',
  })
  studentCode?: string;

  @ApiPropertyOptional({
    description: 'Student avatar URL',
    example: 'https://example.com/avatar.jpg',
    type: 'string',
    nullable: true,
  })
  avatarUrl?: string | null;

  @ApiProperty({
    description: 'Breakdown of grades by category',
    type: [StudentCategoryGradeEntity],
  })
  categoryGrades!: StudentCategoryGradeEntity[];

  @ApiProperty({
    description:
      'Detailed list of assignments and quizzes with submission status',
    type: [DetailedGradeItemEntity],
  })
  detailedItems!: DetailedGradeItemEntity[];

  @ApiPropertyOptional({
    description:
      'Overall final score on 10-point scale (null if no scores recorded)',
    example: 8.5,
    type: 'number',
    nullable: true,
  })
  finalScore!: number | null;

  @ApiPropertyOptional({
    description: 'Letter grade conversion (A, B, C, D, F) or null',
    example: 'A',
    type: 'string',
    nullable: true,
  })
  letterGrade!: string | null;

  @ApiPropertyOptional({
    description: 'Academic GPA conversion on 4.0 scale (null if no scores)',
    example: 4.0,
    type: 'number',
    nullable: true,
  })
  gpa4!: number | null;

  @ApiPropertyOptional({
    description:
      'Whether the student passed the course (score >= 4.0), or null if no scores',
    example: true,
    type: 'boolean',
    nullable: true,
  })
  isPassed!: boolean | null;

  @ApiProperty({
    description: 'Coursework completion rate percentage',
    example: 85.0,
    type: 'number',
  })
  completionRate!: number;

  @ApiPropertyOptional({
    description:
      'Student attendance tracking and participation metrics across 4 pillars',
    type: () => AttendanceStudentItemEntity,
  })
  attendanceSummary?: AttendanceStudentItemEntity | null;
}
