import { applyDecorators } from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdminSchoolEntity } from '../entities/admin-school.entity';

export function ApiCreateAdminSchool() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create a new educational institution',
      description:
        'Registers a new school entity under system administrative authority',
    }),
    ApiCreatedResponse({
      description: 'The school entity was created successfully',
      type: AdminSchoolEntity,
    }),
    ApiResponse({ status: 409, description: 'School code or name conflict' }),
  );
}
