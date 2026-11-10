import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class GradeSubmissionDto {
  @ApiProperty({
    description: 'Awarded score for the submission',
    type: 'number',
    example: 9.5,
  })
  @IsNumber()
  @Min(0)
  score: number;

  @ApiPropertyOptional({
    description: 'Instructor feedback and review notes',
    type: 'string',
    example: 'Great work! Analysis is thorough and clear.',
  })
  @IsOptional()
  @IsString()
  feedback?: string;
}
