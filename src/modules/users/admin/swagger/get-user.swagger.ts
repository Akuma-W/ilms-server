import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';
import { UserEntity } from '../../entities/user.entity';

export function ApiGetUser() {
  return applyDecorators(
    ApiOperation({ summary: 'Get user details by identifier (Admin only)' }),
    ApiAuth(),
    ApiResponse({
      status: 200,
      description: 'User details retrieved successfully',
      type: UserEntity,
    }),
    ApiResponse({
      status: 404,
      description: 'User not found',
    }),
  );
}
