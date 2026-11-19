import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdminClassEntity } from '../entities/admin-class.entity';

export function ApiUpdateAdminClass() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update classroom metadata as administrator',
      description:
        'Modifies classroom title, capacity, visibility, or assigned lead instructor',
    }),
    ApiOkResponse({
      description: 'Classroom updated successfully',
      type: AdminClassEntity,
    }),
    ApiResponse({ status: 400, description: 'Bad Request' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Forbidden' }),
    ApiResponse({ status: 404, description: 'Classroom not found' }),
  );
}
