import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FileType } from 'src/generated/prisma/enums';

export class SubmissionFileEntity {
  @ApiProperty({
    description: 'Submission file unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: 'string',
  })
  id: string;

  @ApiProperty({
    description: 'Stored file path or URL in storage',
    example: 'submissions/homework.pdf',
    type: 'string',
  })
  fileUrl: string;

  @ApiPropertyOptional({
    description: 'Format type of submitted file',
    example: 'pdf',
    enum: FileType,
    type: 'string',
  })
  fileType?: FileType | null;

  @ApiPropertyOptional({
    description: 'Original file name',
    example: 'homework.pdf',
    type: 'string',
  })
  fileName?: string;

  @ApiPropertyOptional({
    description: 'Size of file in bytes',
    example: 204800,
    type: 'number',
  })
  fileSize?: number;

  @ApiPropertyOptional({
    description: 'Upload timestamp',
    example: '2026-11-08T12:00:00.000Z',
    type: 'string',
  })
  createdAt?: Date | string | null;

  @ApiProperty({
    description: 'Submission unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174001',
    type: 'string',
  })
  submissionId: string;
}

export class SubmissionStudentEntity {
  @ApiProperty({
    description: 'Student unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: 'string',
  })
  id: string;

  @ApiProperty({
    description: 'Full name of the student',
    example: 'Nguyen Van A',
    type: 'string',
  })
  fullName: string;

  @ApiProperty({
    description: 'Email address of the student',
    example: 'student@example.com',
    type: 'string',
  })
  email: string;

  @ApiPropertyOptional({
    description: 'Avatar image URL of the student',
    example: 'https://example.com/avatar.jpg',
    type: 'string',
  })
  avatarUrl?: string | null;
}

export class SubmissionEntity {
  @ApiProperty({
    description: 'Submission unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: 'string',
  })
  id: string;

  @ApiPropertyOptional({
    description: 'Text answer submitted by student',
    example: 'Here is my submission text answer...',
    type: 'string',
  })
  textAnswer?: string | null;

  @ApiPropertyOptional({
    description: 'Score given by teacher',
    example: 9.5,
    type: 'number',
  })
  score?: number | null;

  @ApiPropertyOptional({
    description: 'Teacher feedback and comments',
    example: 'Well structured and accurate solution.',
    type: 'string',
  })
  feedback?: string | null;

  @ApiProperty({
    description: 'Whether the submission was submitted after deadline',
    example: false,
    type: 'boolean',
  })
  isLate: boolean;

  @ApiPropertyOptional({
    description: 'Submission timestamp',
    example: '2026-11-08T12:00:00.000Z',
    type: 'string',
  })
  submittedAt?: Date | string | null;

  @ApiProperty({
    description: 'Assignment unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174002',
    type: 'string',
  })
  assignmentId: string;

  @ApiProperty({
    description: 'Student unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174003',
    type: 'string',
  })
  studentId: string;

  @ApiPropertyOptional({
    description: 'Student profile information',
    type: () => SubmissionStudentEntity,
  })
  student?: SubmissionStudentEntity;

  @ApiPropertyOptional({
    description: 'List of submitted files',
    type: () => [SubmissionFileEntity],
    example: [],
  })
  files?: SubmissionFileEntity[];
}
