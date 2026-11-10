import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FileType } from 'src/generated/prisma/enums';

export class MaterialEntity {
  @ApiProperty({
    description: 'Material unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: 'string',
  })
  id: string;

  @ApiProperty({
    description: 'Title of learning material',
    example: 'Slide Chapter 1: Client-Server Architecture',
    type: 'string',
  })
  title: string;

  @ApiProperty({
    description: 'Format type of material',
    example: 'slide',
    enum: FileType,
    type: 'string',
  })
  materialType: FileType;

  @ApiPropertyOptional({
    description: 'Stored file path or URL in storage',
    example: 'uploads/materials/slide-chapter-1.pdf',
    type: 'string',
  })
  fileUrl?: string | null;

  @ApiPropertyOptional({
    description: 'External link URL if material is a link or video',
    example: 'https://www.youtube.com/watch?v=example',
    type: 'string',
  })
  externalUrl?: string | null;

  @ApiProperty({
    description: 'Topic unique identifier that this material belongs to',
    example: '123e4567-e89b-12d3-a456-426614174001',
    type: 'string',
  })
  topicId: string;

  @ApiPropertyOptional({
    description: 'Creation timestamp',
    example: '2026-11-08T12:00:00.000Z',
    type: 'string',
  })
  createdAt?: Date | null;
}
