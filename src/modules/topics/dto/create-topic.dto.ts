import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreateTopicDto {
  @ApiProperty({
    description: 'Title of topic',
    type: 'string',
    example: 'Chapter 1: Introduction',
  })
  @IsString()
  title: string;

  @ApiPropertyOptional({
    description: 'Description / Introduction of topic',
    type: 'string',
    example: 'Overview of the course',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
