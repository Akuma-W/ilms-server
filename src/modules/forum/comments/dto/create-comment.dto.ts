import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
} from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({
    description: 'Content of the discussion comment or reply',
    example:
      'Theo em trường hợp xấu nhất xảy ra khi mảng đã được sắp xếp trước đó.',
    type: 'string',
  })
  @IsString()
  @IsNotEmpty()
  content!: string;

  @ApiPropertyOptional({
    description: 'Parent comment identifier if replying to an existing comment',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: 'string',
    nullable: true,
  })
  @ValidateIf((_, val) => Boolean(val))
  @IsUUID()
  @IsOptional()
  parentId?: string | null;

  @ApiPropertyOptional({
    description: 'Whether the author identity should be hidden from classmates',
    example: false,
    type: 'boolean',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isAnonymous?: boolean;

  @ApiPropertyOptional({
    description: 'Forum discussion unique identifier (optional in body)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: 'string',
  })
  @ValidateIf((_, val) => Boolean(val))
  @IsUUID()
  @IsOptional()
  forumId?: string;
}
