import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class SubmitAnswerItemDto {
  @ApiProperty({
    description: 'Unique identifier of the question',
    example: '33333333-3333-3333-3333-333333333333',
    type: 'string',
  })
  @IsUUID()
  @IsNotEmpty()
  questionId!: string;

  @ApiProperty({
    description: 'Array of selected option UUIDs for this question',
    type: [String],
    example: ['55555555-5555-5555-5555-555555555555'],
  })
  @IsArray()
  @IsUUID('all', { each: true })
  selectedOptionIds!: string[];
}

export class SubmitAttemptDto {
  @ApiProperty({
    description: 'List of submitted answers for quiz questions',
    type: [SubmitAnswerItemDto],
    example: [
      {
        questionId: '33333333-3333-3333-3333-333333333333',
        selectedOptionIds: ['55555555-5555-5555-5555-555555555555'],
      },
    ],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => SubmitAnswerItemDto)
  answers!: SubmitAnswerItemDto[];
}
