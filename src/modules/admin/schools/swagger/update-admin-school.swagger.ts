import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdminSchoolEntity } from '../entities/admin-school.entity';

export function ApiUpdateAdminSchool() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update school institutional attributes and status',
      description:
        'Modifies school profile metadata or transitions status to deactivated/archived',
    }),
    ApiOkResponse({
      description: 'The school entity was updated successfully',
      type: AdminSchoolEntity,
    }),
    ApiResponse({ status: 404, description: 'School not found' }),
  );
}
