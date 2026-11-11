import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StudentCategoryGradeEntity {
  @ApiProperty({
    description: 'Category UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: 'string',
  })
  categoryId!: string;

  @ApiProperty({
    description: 'Category display name',
    example: 'Chuyên cần',
    type: 'string',
  })
  categoryName!: string;

  @ApiProperty({
    description: 'Category weight (0.01 to 1.0)',
    example: 0.2,
    type: 'number',
  })
  weight!: number;

  @ApiPropertyOptional({
    description: 'Raw score earned in this category on 10-point scale',
    example: 9.0,
    type: 'number',
    nullable: true,
  })
  score!: number | null;

  @ApiPropertyOptional({
    description: 'Weighted score contribution (score * weight)',
    example: 1.8,
    type: 'number',
    nullable: true,
  })
  weightedScore!: number | null;
}

export class DetailedGradeItemEntity {
  @ApiProperty({
    description: 'Item UUID (assignment, quiz or exam)',
    example: '123e4567-e89b-12d3-a456-426614174002',
    type: 'string',
  })
  id!: string;

  @ApiProperty({
    description: 'Item title',
    example: 'Bài tập 1: Thiết kế CSDL',
    type: 'string',
  })
  title!: string;

  @ApiProperty({
    description: 'Type of graded item',
    example: 'assignment',
    enum: ['assignment', 'quiz', 'attendance'],
    type: 'string',
  })
  type!: 'assignment' | 'quiz' | 'attendance';

  @ApiProperty({
    description: 'Maximum attainable score',
    example: 10,
    type: 'number',
  })
  maxScore!: number;

  @ApiPropertyOptional({
    description: 'Score earned by student',
    example: 8.5,
    type: 'number',
    nullable: true,
  })
  earnedScore!: number | null;

  @ApiProperty({
    description: 'Grading status of the item',
    example: 'graded',
    enum: ['graded', 'pending', 'unsubmitted'],
    type: 'string',
  })
  status!: 'graded' | 'pending' | 'unsubmitted';

  @ApiPropertyOptional({
    description: 'Teacher feedback or note',
    example: 'Bài làm rất tốt',
    type: 'string',
    nullable: true,
  })
  feedback?: string | null;

  @ApiPropertyOptional({
    description: 'Submission timestamp string',
    example: '2026-11-10T12:00:00.000Z',
    type: 'string',
    nullable: true,
  })
  submittedAt?: string | null;
}

export class GradeRecordEntity {
  @ApiProperty({
    description: 'Student UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: 'string',
  })
  studentId!: string;

  @ApiProperty({
    description: 'Student full name',
    example: 'Nguyễn Văn A',
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
}
