import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OptionEntity } from './option.entity';

export class QuestionEntity {
  @ApiProperty({
    description: 'Unique identifier of question',
    example: '33333333-3333-3333-3333-333333333333',
    type: 'string',
  })
  id!: string;

  @ApiProperty({
    description: 'Question content',
    example: 'Which layer of OSI model does HTTP belong to?',
    type: 'string',
  })
  content!: string;

  @ApiProperty({
    description: 'Type of question',
    example: 'multiple_choice',
    type: 'string',
    enum: ['multiple_choice', 'multiple_select', 'true_false'],
  })
  questionType!: string;

  @ApiPropertyOptional({
    description: 'Points awarded for question',
    example: 1.0,
    type: 'number',
  })
  points?: number | null;

  @ApiPropertyOptional({
    description: 'Order index within quiz',
    example: 1,
    type: 'number',
  })
  orderIndex?: number | null;

  @ApiPropertyOptional({
    description: 'Detailed explanation for correct answer',
    example: 'HTTP operates at layer 7 (Application)',
    type: 'string',
  })
  explanation?: string | null;

  @ApiProperty({
    description: 'Associated Quiz ID',
    example: '22222222-2222-2222-2222-222222222222',
    type: 'string',
  })
  quizId!: string;

  @ApiProperty({
    description: 'List of answer options',
    type: [OptionEntity],
    example: [
      {
        id: '55555555-5555-5555-5555-555555555555',
        content: 'Application Layer',
        isCorrect: true,
        questionId: '33333333-3333-3333-3333-333333333333',
      },
    ],
  })
  options!: OptionEntity[];
}
