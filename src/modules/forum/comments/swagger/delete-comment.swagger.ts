import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam } from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';

export function ApiDeleteComment() {
  return applyDecorators(
    ApiOperation({ summary: 'Soft delete a comment from a forum discussion' }),
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
    ApiOkResponse({
      description: 'Comment deleted successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: {
            type: 'string',
            example: 'Comment deleted successfully',
          },
        },
      },
    }),
  );
}
