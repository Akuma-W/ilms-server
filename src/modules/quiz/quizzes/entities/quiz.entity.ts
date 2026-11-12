import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { QuizCreatorSummary } from './quiz-creator-summary.entity';

export class QuizEntity {
  @ApiProperty({
    description: 'Unique identifier of the quiz',
    example: '22222222-2222-2222-2222-222222222222',
    type: 'string',
  })
  id!: string;

  @ApiProperty({
    description: 'Title of the quiz',
    example: 'Midterm Examination: Computer Network Basics',
    type: 'string',
  })
  title!: string;

  @ApiPropertyOptional({
    description: 'Detailed description of the quiz',
    example: 'Assessment covering OSI model, TCP/IP, and routing protocols',
    type: 'string',
  })
  description?: string | null;

  @ApiProperty({
    description: 'Time limit in minutes',
    example: 45,
    type: 'number',
  })
  timeLimit!: number;

  @ApiProperty({
    description: 'Visibility of the quiz',
    example: 'public',
    type: 'string',
  })
  visibility!: string;

  @ApiProperty({
    description: 'Status of the quiz',
    example: 'published',
    type: 'string',
  })
  status!: string;

  @ApiProperty({
    description: 'User ID of creator',
    example: '11111111-1111-1111-1111-111111111111',
    type: 'string',
  })
  createdBy!: string;

  @ApiPropertyOptional({
    description: 'Creation timestamp',
    example: '2026-11-12T02:00:00.000Z',
    type: 'string',
  })
  createdAt?: Date | null;

  @ApiPropertyOptional({
    description: 'Last update timestamp',
    example: '2026-11-12T02:30:00.000Z',
    type: 'string',
  })
  updatedAt?: Date | null;

  @ApiPropertyOptional({
    description: 'Total number of questions in quiz',
    example: 25,
    type: 'number',
  })
  totalQuestions?: number;

  @ApiPropertyOptional({
    description: 'Total points sum of questions in quiz',
    example: 10,
    type: 'number',
  })
  totalPoints?: number;

  @ApiPropertyOptional({
    description: 'Creator profile information',
    type: () => QuizCreatorSummary,
    example: {
      id: '11111111-1111-1111-1111-111111111111',
      fullName: 'Dr. John Doe',
      avatarUrl: 'https://example.com/avatar.png',
    },
  })
  creator?: QuizCreatorSummary;
}
