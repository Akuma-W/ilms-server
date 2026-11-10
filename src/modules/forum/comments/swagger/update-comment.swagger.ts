import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';
import { UpdateCommentDto } from '../dto/update-comment.dto';
import { CommentEntity } from '../entities/comment.entity';

export function ApiUpdateComment() {
  return applyDecorators(
    ApiOperation({ summary: 'Update an existing comment' }),
    ApiAuth(),
    ApiParam({
      name: 'forumId',
      type: String,
      description: 'Forum discussion unique identifier',
    }),
    ApiParam({
      name: 'commentId',
      type: String,
      description: 'Comment unique identifier',
    }),
    ApiBody({ type: UpdateCommentDto }),
    ApiOkResponse({
      description: 'Comment updated successfully',
      type: CommentEntity,
    }),
  );
}
