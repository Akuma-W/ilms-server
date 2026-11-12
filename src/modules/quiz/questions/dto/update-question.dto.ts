import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { CreateOptionDto } from './create-option.dto';

export class UpdateQuestionDto {
  @ApiPropertyOptional({
    description: 'Updated content of the question',
    example: 'Which layer of the OSI model does TCP protocol belong to?',
    type: 'string',
  })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({
    description: 'Updated question type',
    example: 'multiple_choice',
    type: 'string',
    enum: ['multiple_choice', 'multiple_select', 'true_false'],
  })
  @IsOptional()
  @IsEnum(['multiple_choice', 'multiple_select', 'true_false'])
  questionType?: 'multiple_choice' | 'multiple_select' | 'true_false';

  @ApiPropertyOptional({
    description: 'Updated points for the question',
    example: 2.0,
    type: 'number',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  points?: number;

  @ApiPropertyOptional({
    description: 'Updated display order index',
    example: 2,
    type: 'number',
  })
  @IsOptional()
  @IsNumber()
  orderIndex?: number;

  @ApiPropertyOptional({
    description: 'Updated explanation',
    example: 'TCP is a connection-oriented Transport layer protocol',
    type: 'string',
  })
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiPropertyOptional({
    description: 'Updated answer options (replaces existing options)',
    type: [CreateOptionDto],
    example: [
      { content: 'Transport Layer', isCorrect: true },
      { content: 'Network Layer', isCorrect: false },
    ],
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => CreateOptionDto)
  options?: CreateOptionDto[];
}
