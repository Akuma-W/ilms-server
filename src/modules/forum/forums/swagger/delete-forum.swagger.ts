import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam } from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';

export function ApiDeleteForum() {
  return applyDecorators(
    ApiOperation({ summary: 'Soft delete a discussion topic' }),
    ApiAuth(),
    ApiParam({
      name: 'forumId',
      type: String,
      description: 'Forum discussion unique identifier',
    }),
    ApiOkResponse({
      description: 'Discussion topic deleted successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: {
            type: 'string',
            example: 'Discussion topic deleted successfully',
          },
        },
      },
    }),
  );
}
