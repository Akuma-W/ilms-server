import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export enum ForumTabFilter {
  ALL = 'all',
  UNANSWERED = 'unanswered',
  MY_POSTS = 'my_posts',
}

export class QueryForumDto {
  @ApiPropertyOptional({
    description: 'Filter tab for discussion posts',
    example: ForumTabFilter.ALL,
    enum: ForumTabFilter,
    type: 'string',
    default: ForumTabFilter.ALL,
  })
  @IsEnum(ForumTabFilter)
  @IsOptional()
  tab?: ForumTabFilter = ForumTabFilter.ALL;

  @ApiPropertyOptional({
    description: 'Search keyword matching title or content',
    example: 'QuickSort',
    type: 'string',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    type: 'number',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    type: 'number',
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
