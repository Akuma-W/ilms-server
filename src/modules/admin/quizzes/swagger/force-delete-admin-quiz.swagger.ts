import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiForceDeleteAdminQuiz() {
  return applyDecorators(
    ApiOperation({
      summary: 'Force remove copyright-infringing quiz',
      description:
        'Permanently deletes quiz examination from system bypassing ownership lock',
    }),
    ApiOkResponse({
      description: 'Quiz was force-deleted successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: {
            type: 'string',
            example: 'Quiz deleted successfully by administrator',
          },
        },
      },
    }),
    ApiResponse({ status: 404, description: 'Quiz not found' }),
  );
}
