import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdminUserEntity } from '../entities/admin-user.entity';

export function ApiGetAdminUser() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get user account details by UUID',
      description:
        'Retrieves complete user record without revealing password hashes',
    }),
    ApiOkResponse({
      description: 'User account details',
      type: AdminUserEntity,
    }),
    ApiResponse({ status: 404, description: 'User not found' }),
  );
}
