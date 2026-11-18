import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TopSchoolEntity } from '../entities/top-school.entity';

export function ApiGetDashboardTopSchools() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get top active schools leaderboard',
      description:
        'Retrieves the most active educational institutions ranked by classroom scale and student population',
    }),
    ApiOkResponse({
      description: 'Leaderboard ranking of top active institutions',
      type: [TopSchoolEntity],
    }),
    ApiResponse({ status: 401, description: 'Unauthorized access' }),
    ApiResponse({
      status: 403,
      description: 'Forbidden access for non-administrators',
    }),
  );
}
