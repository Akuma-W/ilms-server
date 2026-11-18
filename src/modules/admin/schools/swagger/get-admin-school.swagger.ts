import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdminSchoolEntity } from '../entities/admin-school.entity';

export function ApiGetAdminSchool() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get school details by UUID with statistics',
      description:
        'Retrieves complete institutional profile with aggregated counts',
    }),
    ApiOkResponse({
      description: 'School record and aggregated telemetry',
      type: AdminSchoolEntity,
    }),
    ApiResponse({ status: 404, description: 'School not found' }),
  );
}
