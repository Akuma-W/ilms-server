import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ClassEntity {
  @ApiProperty({
    description: 'Unique identifier of the class',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: 'string',
  })
  id: string;

  @ApiProperty({
    description: 'Title of the class',
    example: 'Web Application Development',
    type: 'string',
  })
  title: string;

  @ApiProperty({
    description: 'Subject of the class',
    example: 'Software Engineering',
    type: 'string',
  })
  subject: string;

  @ApiPropertyOptional({
    description: 'Detailed description of the class syllabus',
    example:
      'Comprehensive introduction to full-stack web development with NestJS and Next.js.',
    type: 'string',
  })
  description?: string | null;

  @ApiPropertyOptional({
    description: 'Unique 6-character alphanumeric code for student enrollment',
    example: 'SE347X',
    type: 'string',
  })
  courseCode?: string | null;

  @ApiPropertyOptional({
    description: 'Academic semester',
    example: 'HK1-2026',
    type: 'string',
  })
  semester?: string | null;

  @ApiProperty({
    description: 'Whether the class is private and hidden from public search',
    example: false,
    type: 'boolean',
  })
  isPrivate: boolean;

  @ApiPropertyOptional({
    description: 'Online meeting room URI',
    example: 'https://meet.google.com/abc-defg-hij',
    type: 'string',
  })
  meetingUri?: string | null;

  @ApiPropertyOptional({
    description: 'External meeting space identifier',
    example: 'space-12345',
    type: 'string',
  })
  meetingSpaceId?: string | null;

  @ApiProperty({
    description: 'Whether the class is archived',
    example: false,
    type: 'boolean',
  })
  isArchived: boolean;

  @ApiProperty({
    description: 'Identifier of the school organizing this class',
    example: '123e4567-e89b-12d3-a456-426614174001',
    type: 'string',
  })
  schoolId: string;

  @ApiProperty({
    description: 'Identifier of the primary teacher managing this class',
    example: '123e4567-e89b-12d3-a456-426614174002',
    type: 'string',
  })
  teacherId: string;

  @ApiPropertyOptional({
    description: 'Total approved students enrolled in this class',
    example: 45,
    type: 'number',
  })
  totalStudents?: number;

  @ApiPropertyOptional({
    description: 'Creation timestamp',
    example: '2026-11-01T12:00:00.000Z',
    type: 'string',
  })
  createdAt?: Date | string | null;
}

export class Class extends ClassEntity {}
