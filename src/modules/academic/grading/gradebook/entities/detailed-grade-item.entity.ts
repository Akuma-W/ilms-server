import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DetailedGradeItemEntity {
  @ApiProperty({
    description: 'Item UUID (assignment, quiz or exam)',
    example: '123e4567-e89b-12d3-a456-426614174002',
    type: 'string',
  })
  id!: string;

  @ApiProperty({
    description: 'Item title',
    example: 'Assignment 1: Database Design',
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
    description: 'Raw score before normalization',
    example: 85,
    type: 'number',
    nullable: true,
  })
  rawScore?: number | null;

  @ApiPropertyOptional({
    description: 'Original maximum scale of the assignment or quiz',
    example: 100,
    type: 'number',
    nullable: true,
  })
  originalMaxScore?: number | null;

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
    example: 'Great work on queries',
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
