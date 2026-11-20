import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GradeSourceType } from 'src/generated/prisma/enums';
import { Prisma } from 'src/generated/prisma/client';

export class GradeCategoryEntity {
  @ApiProperty({
    description: 'Unique identifier of the grade category',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: 'string',
  })
  id!: string;

  @ApiProperty({
    description: 'Name of the grade category',
    example: 'Attendance',
    type: 'string',
  })
  name!: string;

  @ApiProperty({
    description:
      'Weight of the category in overall grade calculation (0.01 to 1.0)',
    example: 0.2,
    type: 'number',
  })
  weight!: number;

  @ApiProperty({
    description: 'Classroom ID associated with this category',
    example: '123e4567-e89b-12d3-a456-426614174001',
    type: 'string',
  })
  classId!: string;

  @ApiProperty({
    description: 'Display sequence order index of the category',
    example: 1,
    type: 'number',
  })
  orderIndex!: number;

  @ApiProperty({
    description: 'Source type for automatic grade calculation',
    example: 'attendance',
    enum: GradeSourceType,
    type: 'string',
  })
  sourceType!: GradeSourceType;

  @ApiPropertyOptional({
    description:
      'Associated resource identifier (assignmentId or quizPublicationId)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: 'string',
  })
  sourceId?: string | null;

  @ApiPropertyOptional({
    description:
      'Calculation configuration schema (pillars, thresholds, direct items)',
    example: {
      strategy: 'progress_unified',
      pillars: {
        meetings: { weight: 0.2, minRate: 90 },
        materials: { weight: 0.05, minRate: 50, strictThreshold: true },
        assignments: { weight: 0.1 },
        quizzes: { weight: 0.1 },
      },
    },
    type: 'object',
    additionalProperties: true,
  })
  config?: Prisma.JsonValue | null;
}
