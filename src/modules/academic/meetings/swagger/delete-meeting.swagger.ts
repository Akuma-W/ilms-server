import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiDeleteMeetingSession() {
  return applyDecorators(
    ApiOperation({
      summary: 'Delete a scheduled or concluded meeting session',
      description:
        'Deletes the meeting session and cascades removal of attendance records. Only class teacher or admin can perform this.',
    }),
    ApiResponse({
      status: 200,
      description: 'Session successfully deleted',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Meeting deleted successfully' },
        },
      },
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - only class teacher or admin can delete meeting',
    }),
    ApiResponse({
      status: 404,
      description: 'Meeting session not found',
    }),
  );
}
