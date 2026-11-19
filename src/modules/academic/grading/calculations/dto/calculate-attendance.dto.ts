import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsUUID, Max, Min } from 'class-validator';

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
}
