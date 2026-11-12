import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PublicationQuizSummary } from './publication-quiz-summary.entity';

export class QuizPublicationEntity {
  @ApiProperty({
    description: 'Unique identifier of publication',
    example: '88888888-8888-8888-8888-888888888888',
    type: 'string',
  })
  id!: string;

  @ApiProperty({
    description: 'Associated Quiz ID',
    example: '22222222-2222-2222-2222-222222222222',
    type: 'string',
  })
  quizId!: string;

  @ApiPropertyOptional({
    description: 'Associated Class ID',
    example: '66666666-6666-6666-6666-666666666666',
    type: 'string',
  })
  classId?: string | null;

  @ApiPropertyOptional({
    description: 'Associated Topic ID',
    example: '77777777-7777-7777-7777-777777777777',
    type: 'string',
  })
  topicId?: string | null;

  @ApiPropertyOptional({
    description: 'Opening datetime',
    example: '2026-11-15T08:00:00.000Z',
    type: 'string',
  })
  openAt?: Date | null;

  @ApiPropertyOptional({
    description: 'Closing datetime',
    example: '2026-11-20T23:59:59.000Z',
    type: 'string',
  })
  closeAt?: Date | null;

  @ApiProperty({
    description: 'Public visibility flag',
    example: false,
    type: 'boolean',
  })
  isPublic!: boolean;

  @ApiPropertyOptional({
    description: 'Publication creation timestamp',
    example: '2026-11-12T02:00:00.000Z',
    type: 'string',
  })
  publishedAt?: Date | null;

  @ApiPropertyOptional({
    description: 'Quiz summary details',
    type: () => PublicationQuizSummary,
    example: {
      id: '22222222-2222-2222-2222-222222222222',
      title: 'Midterm Examination: Computer Network Basics',
      timeLimit: 45,
      totalQuestions: 20,
    },
  })
  quiz?: PublicationQuizSummary;

  @ApiPropertyOptional({
    description: 'Total student attempts count',
    example: 35,
    type: 'number',
  })
  totalAttemptsCount?: number;

  @ApiPropertyOptional({
    description: 'Latest user attempt in class context',
    type: 'object',
    additionalProperties: false,
    properties: {
      id: { type: 'string' },
      score: { type: 'number', nullable: true },
      startedAt: { type: 'string', format: 'date-time' },
      submittedAt: { type: 'string', format: 'date-time', nullable: true },
    },
  })
  latestUserAttempt?: {
    id: string;
    score: number | null;
    startedAt: Date;
    submittedAt: Date | null;
  } | null;
}
