import { applyDecorators } from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdminUserEntity } from '../entities/admin-user.entity';

export function ApiCreateAdminUser() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create a new user account directly by administrator',
      description:
        'Registers a new student, teacher, or administrator account with credentials',
    }),
    ApiCreatedResponse({
      description: 'The user account was created successfully',
      type: AdminUserEntity,
    }),
    ApiResponse({ status: 409, description: 'Email address already exists' }),
  );
}
