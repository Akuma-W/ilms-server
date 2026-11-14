import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { ReviewMode } from 'src/generated/prisma/enums';

export class PublishQuizDto {
  @ApiProperty({
    description: 'Class ID to publish this quiz into',
    example: '66666666-6666-6666-6666-666666666666',
    type: 'string',
  })
  @IsUUID()
  @IsNotEmpty()
  classId!: string;

  @ApiPropertyOptional({
    description: 'Topic ID to associate this quiz with',
    example: '77777777-7777-7777-7777-777777777777',
    type: 'string',
  })
  @IsOptional()
  @IsUUID()
  topicId?: string;

  @ApiPropertyOptional({
    description: 'Opening datetime of the quiz',
    example: '2026-11-15T08:00:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  openAt?: Date;

  @ApiPropertyOptional({
    description: 'Closing datetime of the quiz',
    example: '2026-11-20T23:59:59.000Z',
    type: 'string',
    format: 'date-time',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  closeAt?: Date;

  @ApiPropertyOptional({
    description: 'Whether this publication is public across the platform',
    example: false,
    type: 'boolean',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean = false;

  @ApiPropertyOptional({
    description: 'Review mode for student results in this publication',
    example: 'after_submission',
    type: 'string',
    enum: ['immediate', 'after_submission', 'after_closed', 'never'],
    default: 'after_submission',
  })
  @IsOptional()
  @IsEnum(ReviewMode)
  reviewMode?: ReviewMode = ReviewMode.after_submission;
}
