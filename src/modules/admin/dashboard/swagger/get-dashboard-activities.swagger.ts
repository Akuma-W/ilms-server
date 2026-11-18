import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RecentActivityEntity } from '../entities/recent-activity.entity';

export function ApiGetDashboardActivities() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get recent system audit events',
      description:
        'Retrieves chronological log of recent high-value events such as class creation and user registrations',
    }),
    ApiOkResponse({
      description: 'List of recent system activities',
      type: [RecentActivityEntity],
    }),
    ApiResponse({ status: 401, description: 'Unauthorized access' }),
    ApiResponse({
      status: 403,
      description: 'Forbidden access for non-administrators',
    }),
  );
}
