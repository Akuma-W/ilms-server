import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PublicationQuizSummary {
  @ApiProperty({
    description: 'Unique identifier of quiz',
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

  @ApiProperty({
    description: 'Time limit in minutes',
    example: 45,
    type: 'number',
  })
  timeLimit!: number;

  @ApiPropertyOptional({
    description: 'Total number of questions in quiz',
    example: 20,
    type: 'number',
  })
  totalQuestions?: number;
}
