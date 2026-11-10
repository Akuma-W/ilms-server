import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ForumAuthorEntity } from '../../forums/entities/forum-author.entity';

export class CommentEntity {
  @ApiProperty({
    description: 'Unique comment identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: 'string',
  })
  id!: string;

  @ApiProperty({
    description: 'Content of the comment or reply',
    example: 'Em có thể nộp bổ sung tệp đính kèm được không ạ?',
    type: 'string',
  })
  content!: string;

  @ApiProperty({
    description:
      'Indicates whether the comment author is anonymous to classmates',
    example: false,
    type: 'boolean',
  })
  isAnonymous!: boolean;

  @ApiProperty({
    description: 'Soft delete flag of the comment',
    example: false,
    type: 'boolean',
  })
  isDeleted!: boolean;

  @ApiPropertyOptional({
    description: 'Timestamp when the comment was created',
    example: '2026-11-10T12:00:00.000Z',
    type: 'string',
  })
  createdAt?: Date | string | null;

  @ApiPropertyOptional({
    description: 'Timestamp when the comment was last updated',
    example: '2026-11-10T12:30:00.000Z',
    type: 'string',
  })
  updatedAt?: Date | string | null;

  @ApiProperty({
    description: 'Parent forum identifier',
    example: '123e4567-e89b-12d3-a456-426614174001',
    type: 'string',
  })
  forumId!: string;

  @ApiProperty({
    description: 'Author user identifier',
    example: '123e4567-e89b-12d3-a456-426614174002',
    type: 'string',
  })
  authorId!: string;

  @ApiPropertyOptional({
    description: 'Parent comment identifier if this is a reply',
    example: null,
    type: 'string',
    nullable: true,
  })
  parentId?: string | null;

  @ApiPropertyOptional({
    description: 'Author information',
    type: () => ForumAuthorEntity,
  })
  author?: ForumAuthorEntity;

  @ApiPropertyOptional({
    description: 'List of nested replies to this comment',
    type: () => [CommentEntity],
  })
  replies?: CommentEntity[];
}
