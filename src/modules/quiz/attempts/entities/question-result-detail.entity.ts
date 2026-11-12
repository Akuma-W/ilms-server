import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class QuestionResultDetailEntity {
  @ApiProperty({
    description: 'Unique identifier of question',
    example: '33333333-3333-3333-3333-333333333333',
    type: 'string',
  })
  questionId!: string;

  @ApiProperty({
    description: 'Whether the answer submitted was correct',
    example: true,
    type: 'boolean',
  })
  isCorrect!: boolean;

  @ApiProperty({
    description: 'Points earned for this question',
    example: 1.0,
    type: 'number',
  })
  pointsEarned!: number;

  @ApiProperty({
    description: 'Maximum points possible for this question',
    example: 1.0,
    type: 'number',
  })
  maxPoints!: number;

  @ApiPropertyOptional({
    description: 'Explanation for correct answer',
    example: 'HTTP belongs to Application layer (Layer 7)',
    type: 'string',
  })
  explanation?: string | null;

  @ApiProperty({
    description: 'Option IDs selected by user',
    type: [String],
    example: ['55555555-5555-5555-5555-555555555555'],
  })
  selectedOptionIds!: string[];

  @ApiProperty({
    description: 'Correct option IDs for this question',
    type: [String],
    example: ['55555555-5555-5555-5555-555555555555'],
  })
  correctOptionIds!: string[];
}
