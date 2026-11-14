import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { QuizStatus, ReviewMode, Visibility } from 'src/generated/prisma/enums';

export class CreateQuizDto {
  @ApiProperty({
    description: 'Title of the quiz',
    example: 'Midterm Examination: Computer Network Basics',
    type: 'string',
  })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({
    description: 'Detailed description of the quiz',
    example:
      'Comprehensive assessment covering OSI model, TCP/IP, and routing protocols',
    type: 'string',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Time limit in minutes',
    example: 45,
    type: 'number',
  })
  @IsInt()
  @Min(1)
  timeLimit!: number;

  @ApiPropertyOptional({
    description: 'Visibility mode of the quiz',
    example: 'private',
    type: 'string',
    enum: ['public', 'private'],
    default: 'private',
  })
  @IsOptional()
  @IsEnum(Visibility)
  visibility?: Visibility;

  @ApiPropertyOptional({
    description: 'Status of the quiz',
    example: 'draft',
    type: 'string',
    enum: ['draft', 'published'],
    default: 'draft',
  })
  @IsOptional()
  @IsEnum(QuizStatus)
  status?: QuizStatus;

  @ApiPropertyOptional({
    description: 'Result display review mode for self-paced practice',
    example: 'after_submission',
    type: 'string',
    enum: ['immediate', 'after_submission', 'never'],
    default: 'after_submission',
  })
  @IsOptional()
  @IsEnum(ReviewMode)
  reviewMode?: ReviewMode;
}
