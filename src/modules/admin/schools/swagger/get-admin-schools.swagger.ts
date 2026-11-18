import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdminSchoolEntity } from '../entities/admin-school.entity';

export function ApiGetAdminSchools() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get paginated list of schools with aggregated statistics',
      description:
        'Lists all institutions with enrolled students, teachers, and active classes metrics for administrator',
    }),
    ApiOkResponse({
      description: 'Paginated schools payload with metadata counters',
      type: [AdminSchoolEntity],
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Forbidden' }),
  );
}
