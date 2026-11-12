import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class QuizCreatorSummary {
  @ApiProperty({
    description: 'Unique identifier of creator',
    example: '11111111-1111-1111-1111-111111111111',
    type: 'string',
  })
  id!: string;

  @ApiProperty({
    description: 'Full name of creator',
    example: 'Dr. John Doe',
    type: 'string',
  })
  fullName!: string;

  @ApiPropertyOptional({
    description: 'Avatar URL of creator',
    example: 'https://example.com/avatar.png',
    type: 'string',
  })
  avatarUrl?: string | null;
}
