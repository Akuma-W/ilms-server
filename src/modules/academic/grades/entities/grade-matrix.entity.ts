import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GradeCategoryEntity } from '../../grade-categories/entities/grade-category.entity';

export class ClassGradeMatrixRowEntity {
  @ApiProperty({
    description: 'Student UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: 'string',
  })
  studentId!: string;

  @ApiProperty({
    description: 'Full name of the student',
    example: 'Nguyễn Văn A',
    type: 'string',
  })
  studentName!: string;

  @ApiProperty({
    description: 'Email address of the student',
    example: 'student.a@example.edu.vn',
    type: 'string',
  })
  studentEmail!: string;

  @ApiProperty({
    description: 'Student identity code or ID',
    example: 'SV2026-001',
    type: 'string',
  })
  studentCode!: string;

  @ApiPropertyOptional({
    description: 'Avatar image URL of the student',
    example: 'https://example.com/avatar.jpg',
    type: 'string',
    nullable: true,
  })
  avatarUrl?: string | null;

  @ApiProperty({
    description: 'Map of category ID to score earned by the student',
    example: { 'cat-1': 8.5, 'cat-2': 9.0 },
    type: 'object',
    additionalProperties: { type: 'number', nullable: true },
  })
  scores!: Record<string, number | null>;

  @ApiPropertyOptional({
    description:
      'Calculated weighted final score on 10-point scale (null if no scores recorded)',
    example: 8.7,
    type: 'number',
    nullable: true,
  })
  finalScore!: number | null;

  @ApiPropertyOptional({
    description:
      'Academic letter grade conversion (A, B, C, D, F) or null if no scores',
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
}

export class ClassGradeMatrixEntity {
  @ApiProperty({
    description: 'Grade categories configured for this classroom',
    type: [GradeCategoryEntity],
  })
  categories!: GradeCategoryEntity[];

  @ApiProperty({
    description: 'Student rows with individual scores and final summary',
    type: [ClassGradeMatrixRowEntity],
  })
  rows!: ClassGradeMatrixRowEntity[];

  @ApiProperty({
    description: 'Total number of enrolled students',
    example: 45,
    type: 'number',
  })
  totalStudents!: number;

  @ApiProperty({
    description: 'Average final score across the classroom',
    example: '7.85',
    type: 'string',
  })
  averageScore!: string;

  @ApiProperty({
    description: 'Percentage of students who passed with score >= 5.0',
    example: 92.5,
    type: 'number',
  })
  passingRate!: number;
}
