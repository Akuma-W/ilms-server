import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdminGrowthEntity } from '../entities/admin-growth.entity';

export function ApiGetDashboardGrowth() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get 7-day registration and activity growth trends',
      description:
        'Retrieves chronological daily metrics for new users, classes and quiz attempts',
    }),
    ApiOkResponse({
      description: 'List of daily growth trend metrics',
      type: [AdminGrowthEntity],
    }),
    ApiResponse({ status: 401, description: 'Unauthorized access' }),
    ApiResponse({
      status: 403,
      description: 'Forbidden access for non-administrators',
    }),
  );
}
