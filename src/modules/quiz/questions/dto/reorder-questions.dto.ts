import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class QuestionOrderItemDto {
  @ApiProperty({
    description: 'Unique identifier of question',
    example: '33333333-3333-3333-3333-333333333333',
    type: 'string',
  })
  @IsUUID()
  @IsNotEmpty()
  questionId!: string;

  @ApiProperty({
    description: 'Target order index',
    example: 1,
    type: 'number',
  })
  @IsInt()
  @Min(0)
  orderIndex!: number;
}

export class ReorderQuestionsDto {
  @ApiProperty({
    description: 'List of questions and their updated order index',
    type: [QuestionOrderItemDto],
    example: [
      { questionId: '33333333-3333-3333-3333-333333333333', orderIndex: 1 },
      { questionId: '44444444-4444-4444-4444-444444444444', orderIndex: 2 },
    ],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => QuestionOrderItemDto)
  orders!: QuestionOrderItemDto[];
}
