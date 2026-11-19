import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateMeetingDto {
  @ApiProperty({
    description: 'Title of the virtual classroom meeting session',
    example: 'Session 1: Course Overview & Syllabus',
    type: 'string',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({
    description: 'Detailed description, agenda or note for students',
    example: 'Students should prepare chapter 1 slides and laptop for practice',
    type: 'string',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({
    description: 'Scheduled start timestamp in ISO-8601 format',
    example: '2026-11-20T19:30:00.000Z',
    type: 'string',
  })
  @IsDateString()
  startTime!: string;

  @ApiPropertyOptional({
    description:
      'Whether to send automated email notification to approved class members',
    example: true,
    type: 'boolean',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  notifyStudents?: boolean = true;

  @ApiPropertyOptional({
    description: 'Language code for notification template',
    example: 'en',
    enum: ['en', 'vi'],
    type: 'string',
    default: 'en',
  })
  @IsOptional()
  @IsString()
  language?: 'vi' | 'en' = 'en';
}
