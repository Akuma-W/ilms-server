import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReferenceEntity {
  @ApiProperty({
    description: 'Reference unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: 'string',
  })
  id: string;

  @ApiProperty({
    description: 'Title of the reference document or link',
    example: 'Clean Code: A Handbook of Agile Software Craftsmanship',
    type: 'string',
  })
  title: string;

  @ApiProperty({
    description: 'Target URL of the reference',
    example: 'https://example.com/books/clean-code.pdf',
    type: 'string',
  })
  url: string;

  @ApiPropertyOptional({
    description: 'Brief overview or note about the reference',
    example: 'Recommended reading for software architecture design principles',
    type: 'string',
  })
  description?: string | null;

  @ApiProperty({
    description: 'Topic unique identifier that this reference belongs to',
    example: '123e4567-e89b-12d3-a456-426614174001',
    type: 'string',
  })
  topicId: string;
}
