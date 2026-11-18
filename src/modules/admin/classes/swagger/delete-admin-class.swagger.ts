import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiDeleteAdminClass() {
  return applyDecorators(
    ApiOperation({
      summary: 'Permanently remove classroom as administrator',
      description:
        'Force removes classroom section and cascades associated enrollments and resources',
    }),
    ApiOkResponse({
      description: 'Classroom successfully deleted',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: {
            type: 'string',
            example: 'Classroom deleted successfully',
          },
        },
      },
    }),
    ApiResponse({ status: 404, description: 'Classroom not found' }),
  );
}
