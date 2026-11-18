import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdminUserEntity } from '../entities/admin-user.entity';

export function ApiUpdateAdminUser() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update user account profile, role, or operational status',
      description:
        'Modifies user properties; prevents administrator from locking or demoting their own account',
    }),
    ApiOkResponse({
      description: 'The user account was updated successfully',
      type: AdminUserEntity,
    }),
    ApiResponse({
      status: 400,
      description: 'Cannot modify own critical account status',
    }),
    ApiResponse({ status: 404, description: 'User not found' }),
  );
}
