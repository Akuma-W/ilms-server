import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class QueryTopicDto {
  @ApiPropertyOptional({
    description: 'Searching by title',
    type: 'string',
    example: 'Chapter 1',
  })
  @IsOptional()
  @IsString()
  title?: string;
}
