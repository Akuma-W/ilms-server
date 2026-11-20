import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateMeetingDto {
  @ApiPropertyOptional({
    description: 'Updated title of the virtual classroom meeting session',
    example: 'Session 1: Introduction to Advanced Algorithms',
    type: 'string',
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({
    description: 'Updated session description or agenda',
    example: 'Please bring your laptop and review chapter 2 slides',
    type: 'string',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Updated scheduled start timestamp in ISO-8601 format',
    example: '2026-11-20T20:00:00.000Z',
    type: 'string',
  })
  @IsOptional()
  @IsDateString()
  startTime?: string;

  @ApiPropertyOptional({
    description:
      'Whether this session counts towards student attendance scoring',
    example: true,
    type: 'boolean',
  })
  @IsOptional()
  isGraded?: boolean;
}
