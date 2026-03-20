import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreateTopicDto {
  @ApiProperty({
    description: 'Title of topic',
    example: 'Chương 1: Giới thiệu',
  })
  @IsString()
  title: string;

  @ApiPropertyOptional({
    description: 'Description / Introduction of topic',
    example: 'Tổng quan về khóa học',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
