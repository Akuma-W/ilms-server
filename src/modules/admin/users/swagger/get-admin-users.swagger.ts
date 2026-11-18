import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdminUserEntity } from '../entities/admin-user.entity';

export function ApiGetAdminUsers() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get paginated list of all user accounts',
      description:
        'Lists all users with multi-criteria filtering by role, status, school, and keyword search',
    }),
    ApiOkResponse({
      description: 'Paginated user items with metadata',
      type: [AdminUserEntity],
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Forbidden' }),
  );
}
