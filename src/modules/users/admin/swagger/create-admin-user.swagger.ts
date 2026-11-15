import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';
import { UserEntity } from '../../entities/user.entity';

export function ApiCreateAdminUser() {
  return applyDecorators(
    ApiOperation({ summary: 'Create new user account (Admin only)' }),
    ApiAuth(),
    ApiResponse({
      status: 201,
      description: 'User created successfully',
      type: UserEntity,
    }),
    ApiResponse({
      status: 400,
      description: 'Invalid input data',
    }),
    ApiResponse({
      status: 409,
      description: 'Email already exists',
    }),
  );
}
