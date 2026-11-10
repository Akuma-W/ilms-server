import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';
import { CreateCommentDto } from '../dto/create-comment.dto';
import { CommentEntity } from '../entities/comment.entity';

export function ApiCreateComment() {
  return applyDecorators(
    ApiOperation({
      summary: 'Add a new comment or reply to a forum discussion',
    }),
    ApiAuth(),
    ApiParam({
      name: 'forumId',
      type: String,
      description: 'Forum discussion unique identifier',
    }),
    ApiBody({ type: CreateCommentDto }),
    ApiCreatedResponse({
      description: 'Comment created successfully',
      type: CommentEntity,
    }),
  );
}
