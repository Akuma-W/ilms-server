import { applyDecorators } from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdminClassEntity } from '../entities/admin-class.entity';

export function ApiCreateAdminClass() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create classroom directly as administrator',
      description:
        'Creates a new institutional classroom, assigning school, subject, and teacher',
    }),
    ApiCreatedResponse({
      description: 'Classroom created successfully',
      type: AdminClassEntity,
    }),
    ApiResponse({ status: 400, description: 'Bad Request' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Forbidden' }),
  );
}
