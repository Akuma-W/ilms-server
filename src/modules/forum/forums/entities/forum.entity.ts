import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ForumAuthorEntity } from './forum-author.entity';
import { CommentEntity } from '../../comments/entities/comment.entity';

export class ForumEntity {
  @ApiProperty({
    description: 'Unique forum discussion identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: 'string',
  })
  id!: string;

  @ApiProperty({
    description: 'Title of the forum discussion',
    example: '[Hỏi bài] Thắc mắc về bài tập tuần 3',
    type: 'string',
  })
  title!: string;

  @ApiProperty({
    description: 'Detailed content of the discussion topic',
    example:
      'Thầy cho em hỏi phần câu 2 thuật toán BFS áp dụng cho đồ thị có hướng như thế nào ạ?',
    type: 'string',
  })
  content!: string;

  @ApiProperty({
    description:
      'Indicates whether the forum topic author is anonymous to classmates',
    example: false,
    type: 'boolean',
  })
  isAnonymous!: boolean;

  @ApiProperty({
    description: 'Soft delete flag of the forum topic',
    example: false,
    type: 'boolean',
  })
  isDeleted!: boolean;

  @ApiPropertyOptional({
    description: 'Creation timestamp',
    example: '2026-11-10T10:00:00.000Z',
    type: 'string',
  })
  createdAt?: Date | string | null;

  @ApiProperty({
    description: 'Classroom unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174001',
    type: 'string',
  })
  classId!: string;

  @ApiProperty({
    description: 'Author user identifier',
    example: '123e4567-e89b-12d3-a456-426614174002',
    type: 'string',
  })
  createdBy!: string;

  @ApiProperty({
    description: 'Total number of active comments in this forum discussion',
    example: 5,
    type: 'number',
  })
  commentCount!: number;

  @ApiPropertyOptional({
    description: 'Author information',
    type: () => ForumAuthorEntity,
  })
  author?: ForumAuthorEntity;

  @ApiPropertyOptional({
    description: 'List of discussion comments',
    type: () => [CommentEntity],
  })
  comments?: CommentEntity[];
}
