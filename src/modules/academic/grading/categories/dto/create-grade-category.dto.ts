import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { GradeSourceType } from 'src/generated/prisma/enums';

export class CreateGradeCategoryDto {
  @ApiProperty({
    description: 'Name of the grade category',
    example: 'Attendance',
    type: 'string',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @ApiProperty({
    description:
      'Weight of the grade category (e.g. 0.2 for 20%, 0.3 for 30%, 0.5 for 50%)',
    example: 0.2,
    type: 'number',
  })
  @IsNumber()
  @Min(0.01)
  @Max(1.0)
  weight!: number;

  @ApiPropertyOptional({
    description: 'Display sequence order index of the grade category',
    example: 1,
    type: 'number',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  orderIndex?: number;

  @ApiPropertyOptional({
    description: 'Source type for automated grade calculation',
    example: 'attendance',
    enum: GradeSourceType,
    type: 'string',
  })
  @IsOptional()
  @IsEnum(GradeSourceType)
  sourceType?: GradeSourceType;

  @ApiPropertyOptional({
    description:
      'Associated resource identifier (assignmentId or quizPublicationId)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: 'string',
  })
  @IsOptional()
  @IsUUID()
  sourceId?: string;

  @ApiPropertyOptional({
    description:
      'Calculation configuration schema (pillars weights, thresholds, or direct items)',
    example: {
      strategy: 'progress_unified',
      pillars: {
        meetings: { weight: 0.2, minRate: 90 },
        materials: { weight: 0.05, minRate: 50, strictThreshold: true },
        assignments: { weight: 0.1 },
        quizzes: { weight: 0.1 },
      },
      directItems: [
        {
          type: 'quiz',
          id: '123e4567-e89b-12d3-a456-426614174001',
          weight: 0.25,
        },
        {
          type: 'assignment',
          id: '123e4567-e89b-12d3-a456-426614174002',
          weight: 0.3,
        },
      ],
    },
    type: 'object',
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;
}
