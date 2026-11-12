import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { CreateOptionDto } from './create-option.dto';

export class CreateQuestionDto {
  @ApiProperty({
    description: 'Content of the question',
    example: 'Which layer of the OSI model does HTTP protocol belong to?',
    type: 'string',
  })
  @IsString()
  @IsNotEmpty()
  content!: string;

  @ApiProperty({
    description: 'Type of question',
    example: 'multiple_choice',
    type: 'string',
    enum: ['multiple_choice', 'multiple_select', 'true_false'],
  })
  @IsEnum(['multiple_choice', 'multiple_select', 'true_false'])
  questionType!: 'multiple_choice' | 'multiple_select' | 'true_false';

  @ApiPropertyOptional({
    description: 'Maximum points awarded for this question',
    example: 1.0,
    type: 'number',
    default: 1.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  points?: number = 1.0;

  @ApiPropertyOptional({
    description: 'Display order index of question in quiz',
    example: 1,
    type: 'number',
  })
  @IsOptional()
  @IsNumber()
  orderIndex?: number;

  @ApiPropertyOptional({
    description: 'Detailed explanation for correct answer',
    example:
      'HTTP operates at Layer 7 (Application layer) of OSI reference model',
    type: 'string',
  })
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiProperty({
    description: 'List of answer options (minimum 2)',
    type: [CreateOptionDto],
    example: [
      { content: 'Application Layer', isCorrect: true },
      { content: 'Transport Layer', isCorrect: false },
      { content: 'Network Layer', isCorrect: false },
      { content: 'Physical Layer', isCorrect: false },
    ],
  })
  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => CreateOptionDto)
  options!: CreateOptionDto[];
}
