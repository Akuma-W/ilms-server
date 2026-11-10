import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FileType } from 'src/generated/prisma/enums';

export class AssignmentMaterialEntity {
  @ApiProperty({
    description: 'Assignment material unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: 'string',
  })
  id: string;

  @ApiProperty({
    description: 'Stored file path or URL in storage',
    example: 'materials/guideline.pdf',
    type: 'string',
  })
  fileUrl: string;

  @ApiPropertyOptional({
    description: 'Format type of attached file',
    example: 'pdf',
    enum: FileType,
    type: 'string',
  })
  fileType?: FileType | null;

  @ApiPropertyOptional({
    description: 'Original file name',
    example: 'guideline.pdf',
    type: 'string',
  })
  fileName?: string;

  @ApiPropertyOptional({
    description: 'Size of file in bytes',
    example: 1048576,
    type: 'number',
  })
  fileSize?: number;

  @ApiPropertyOptional({
    description: 'Creation timestamp',
    example: '2026-11-08T12:00:00.000Z',
    type: 'string',
  })
  createdAt?: Date | string | null;

  @ApiProperty({
    description: 'Assignment unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174001',
    type: 'string',
  })
  assignmentId: string;
}

export class AssignmentEntity {
  @ApiProperty({
    description: 'Assignment unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: 'string',
  })
  id: string;

  @ApiProperty({
    description: 'Title of the assignment',
    example: 'Assignment 1: Database Design',
    type: 'string',
  })
  title: string;

  @ApiPropertyOptional({
    description: 'Detailed instructions and description',
    example: 'Design an ERD diagram and write SQL scripts.',
    type: 'string',
  })
  description?: string | null;

  @ApiPropertyOptional({
    description: 'Deadline timestamp in ISO format',
    example: '2026-12-31T23:59:59.000Z',
    type: 'string',
  })
  dueAt?: Date | string | null;

  @ApiPropertyOptional({
    description: 'Maximum achievable score',
    example: 10,
    type: 'number',
  })
  maxScore?: number | null;

  @ApiProperty({
    description: 'Class unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174002',
    type: 'string',
  })
  classId: string;

  @ApiPropertyOptional({
    description: 'Topic unique identifier that assignment is linked to',
    example: '123e4567-e89b-12d3-a456-426614174003',
    type: 'string',
  })
  topicId?: string | null;

  @ApiProperty({
    description: 'Creator user unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174004',
    type: 'string',
  })
  createdBy: string;

  @ApiPropertyOptional({
    description: 'Creation timestamp',
    example: '2026-11-08T12:00:00.000Z',
    type: 'string',
  })
  createdAt?: Date | string | null;

  @ApiPropertyOptional({
    description: 'Last update timestamp',
    example: '2026-11-08T12:00:00.000Z',
    type: 'string',
  })
  updatedAt?: Date | string | null;

  @ApiPropertyOptional({
    description: 'Attached instruction materials',
    type: () => [AssignmentMaterialEntity],
    example: [],
  })
  materials?: AssignmentMaterialEntity[];

  @ApiPropertyOptional({
    description: 'Total number of student submissions submitted',
    example: 12,
    type: 'number',
  })
  submissionCount?: number;

  @ApiPropertyOptional({
    description: 'Total number of enrolled students in the class',
    example: 25,
    type: 'number',
  })
  totalStudents?: number;
}
