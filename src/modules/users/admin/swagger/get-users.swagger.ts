import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';
import { UserEntity } from '../../entities/user.entity';

export function ApiGetUsers() {
  return applyDecorators(
    ApiOperation({ summary: 'Get all users across system (Admin only)' }),
    ApiAuth(),
    ApiResponse({
      status: 200,
      description: 'List of users retrieved successfully',
      type: [UserEntity],
    }),
  );
}
