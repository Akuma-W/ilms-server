import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CalculateAttendanceDto {
  @ApiPropertyOptional({
    description: 'Weight of learning material progress (0.0 to 1.0)',
    example: 0.5,
    type: 'number',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  materialWeight?: number;

  @ApiPropertyOptional({
    description: 'Weight of online meeting attendance (0.0 to 1.0)',
    example: 0.5,
    type: 'number',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  meetingWeight?: number;

  @ApiPropertyOptional({
    description: 'Weight of assignments submission completion (0.0 to 1.0)',
    example: 0.1,
    type: 'number',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  assignmentWeight?: number;

  @ApiPropertyOptional({
    description: 'Weight of quiz completion (0.0 to 1.0)',
    example: 0.1,
    type: 'number',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  quizWeight?: number;

  @ApiPropertyOptional({
    description: 'Target attendance grade category identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: 'string',
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({
    description:
      'Whether to preserve manually overridden student scores without overwriting',
    example: true,
    type: 'boolean',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  preserveOverrides?: boolean = true;

  @ApiPropertyOptional({
    description:
      'Minimum meeting attendance rate percentage required for full meeting score (0 to 100)',
    example: 80,
    type: 'number',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  meetingMinRate?: number;

  @ApiPropertyOptional({
    description:
      'Minimum material reading progress rate percentage required for full material score (0 to 100)',
    example: 50,
    type: 'number',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  materialMinRate?: number;

  @ApiPropertyOptional({
    description:
      'Threshold of attended meeting sessions required for full score',
    example: 4,
    type: 'number',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  meetingThreshold?: number;

  @ApiPropertyOptional({
    description:
      'Threshold of completed learning materials required for full score',
    example: 8,
    type: 'number',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  materialThreshold?: number;

  @ApiPropertyOptional({
    description: 'Threshold of submitted assignments required for full score',
    example: 3,
    type: 'number',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  assignmentThreshold?: number;

  @ApiPropertyOptional({
    description: 'Threshold of attempted quizzes required for full score',
    example: 2,
    type: 'number',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  quizThreshold?: number;
}
