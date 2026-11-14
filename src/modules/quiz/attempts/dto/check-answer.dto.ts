import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsNotEmpty, IsUUID } from 'class-validator';

export class CheckAnswerDto {
  @ApiProperty({
    description: 'Unique ID of the question being answered',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: 'string',
  })
  @IsUUID()
  @IsNotEmpty()
  questionId!: string;

  @ApiProperty({
    description: 'Array of selected option UUIDs for the question',
    example: ['123e4567-e89b-12d3-a456-426614174001'],
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  selectedOptionIds!: string[];
}
