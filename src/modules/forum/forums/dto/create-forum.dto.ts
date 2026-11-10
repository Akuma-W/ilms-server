import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  MinLength,
} from 'class-validator';

export class CreateForumDto {
  @ApiProperty({
    description: 'Title of the forum discussion topic',
    example: '[Hỏi bài] Thắc mắc về thuật toán sắp xếp nhanh (QuickSort)',
    type: 'string',
  })
  @IsString()
  @IsNotEmpty()
  @Length(3, 200)
  title!: string;

  @ApiProperty({
    description: 'Detailed content of the discussion topic',
    example:
      'Thầy và các bạn cho mình hỏi trường hợp xấu nhất của QuickSort xảy ra khi nào và cách khắc phục ạ?',
    type: 'string',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  content!: string;

  @ApiPropertyOptional({
    description: 'Whether the author identity should be hidden from classmates',
    example: false,
    type: 'boolean',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isAnonymous?: boolean;
}
