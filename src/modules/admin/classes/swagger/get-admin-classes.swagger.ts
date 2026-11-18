import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdminClassEntity } from '../entities/admin-class.entity';

export function ApiGetAdminClasses() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get paginated list of all classrooms across system',
      description:
        'Lists all public and private classes with school, teacher, and subject associations for administrator',
    }),
    ApiOkResponse({
      description: 'Paginated classroom records with metadata',
      type: [AdminClassEntity],
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Forbidden' }),
  );
}
