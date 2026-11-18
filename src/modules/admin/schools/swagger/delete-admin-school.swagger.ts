import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiDeleteAdminSchool() {
  return applyDecorators(
    ApiOperation({
      summary: 'Delete unlinked school institution',
      description:
        'Permanently removes school if no classes or users are attached; rejects if data exists',
    }),
    ApiOkResponse({
      description: 'School was deleted successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'School deleted successfully' },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Cannot delete school with attached classes or users',
    }),
    ApiResponse({ status: 404, description: 'School not found' }),
  );
}
