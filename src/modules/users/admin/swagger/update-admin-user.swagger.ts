import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';
import { UserEntity } from '../../entities/user.entity';

export function ApiUpdateAdminUser() {
  return applyDecorators(
    ApiOperation({ summary: 'Update user account information (Admin only)' }),
    ApiAuth(),
    ApiResponse({
      status: 200,
      description: 'User updated successfully',
      type: UserEntity,
    }),
    ApiResponse({
      status: 400,
      description: 'Invalid input data',
    }),
    ApiResponse({
      status: 404,
      description: 'User not found',
    }),
  );
}
