import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdminOverviewEntity } from '../entities/admin-overview.entity';

export function ApiGetDashboardOverview() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get system dashboard overview counters',
      description:
        'Retrieves high-level platform count metrics across users, schools, classrooms, and quizzes',
    }),
    ApiOkResponse({
      description: 'System overview KPI metrics payload',
      type: AdminOverviewEntity,
    }),
    ApiResponse({ status: 401, description: 'Unauthorized access' }),
    ApiResponse({
      status: 403,
      description: 'Forbidden access for non-administrators',
    }),
  );
}
