import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class QueryTopicDto {
  @ApiPropertyOptional({
    description: 'Searching by title',
    example: 'Chương 1',
  })
  @IsOptional()
  @IsString()
  title?: string;
}
