import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { QuestionResultDetailEntity } from './question-result-detail.entity';

export class QuizAttemptEntity {
  @ApiProperty({
    description: 'Unique identifier of attempt',
    example: '99999999-9999-9999-9999-999999999999',
    type: 'string',
  })
  id!: string;

  @ApiProperty({
    description: 'Associated Quiz ID',
    example: '22222222-2222-2222-2222-222222222222',
    type: 'string',
  })
  quizId!: string;

  @ApiProperty({
    description: 'Student ID who took the quiz',
    example: '11111111-1111-1111-1111-111111111111',
    type: 'string',
  })
  studentId!: string;

  @ApiPropertyOptional({
    description: 'Associated Publication ID if taken in a class instance',
    example: '88888888-8888-8888-8888-888888888888',
    type: 'string',
  })
  publicationId?: string | null;

  @ApiPropertyOptional({
    description: 'Final score calculated on a 10-point scale',
    example: 8.5,
    type: 'number',
  })
  score?: number | null;

  @ApiProperty({
    description: 'Start timestamp of attempt',
    example: '2026-11-12T02:00:00.000Z',
    type: 'string',
  })
  startedAt!: Date;

  @ApiPropertyOptional({
    description: 'Submission timestamp',
    example: '2026-11-12T02:35:00.000Z',
    type: 'string',
  })
  submittedAt?: Date | null;

  @ApiPropertyOptional({
    description: 'Total number of questions in quiz',
    example: 20,
    type: 'number',
  })
  totalQuestions?: number;

  @ApiPropertyOptional({
    description: 'Number of correctly answered questions',
    example: 17,
    type: 'number',
  })
  correctCount?: number;

  @ApiPropertyOptional({
    description: 'Detailed grading results per question',
    type: [QuestionResultDetailEntity],
  })
  details?: QuestionResultDetailEntity[];
}
