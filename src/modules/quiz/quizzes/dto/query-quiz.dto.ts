import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { QuizStatus, Visibility } from 'src/generated/prisma/enums';

export class QueryQuizDto {
  @ApiPropertyOptional({
    description: 'Current page number',
    example: 1,
    type: 'number',
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Page size limit',
    example: 10,
    type: 'number',
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Keyword search in title or description',
    example: 'Network',
    type: 'string',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by visibility',
    example: 'public',
    type: 'string',
    enum: ['public', 'private'],
  })
  @IsOptional()
  @IsEnum(Visibility)
  visibility?: Visibility;

  @ApiPropertyOptional({
    description: 'Filter by quiz status',
    example: 'published',
    type: 'string',
    enum: ['draft', 'published'],
  })
  @IsOptional()
  @IsEnum(QuizStatus)
  status?: QuizStatus;

  @ApiPropertyOptional({
    description:
      'Scope of quizzes: all (public catalog) or my (created by current user)',
    example: 'all',
    type: 'string',
    enum: ['all', 'my'],
    default: 'all',
  })
  @IsOptional()
  @IsEnum(['all', 'my'])
  scope?: 'all' | 'my' = 'all';
}
