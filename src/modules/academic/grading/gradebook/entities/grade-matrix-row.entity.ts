import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ClassGradeMatrixRowEntity {
  @ApiProperty({
    description: 'Student UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: 'string',
  })
  studentId!: string;

  @ApiProperty({
    description: 'Full name of the student',
    example: 'John Doe',
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
    description: 'Map of category ID to override status and adjustments',
    example: {
      'cat-1': {
        isOverridden: true,
        overrideScore: 9.0,
        reason: 'Adjusted by teacher',
      },
    },
    type: 'object',
    additionalProperties: true,
  })
  overrides?: Record<
    string,
    {
      isOverridden: boolean;
      overrideScore?: number | null;
      reason?: string | null;
    }
  >;

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
