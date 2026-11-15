import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';
import { UserEntity } from '../../entities/user.entity';

export function ApiGetProfile() {
  return applyDecorators(
    ApiOperation({ summary: 'Get current user profile' }),
    ApiAuth(),
    ApiResponse({
      status: 200,
      description: 'Profile retrieved successfully',
      type: UserEntity,
    }),
  );
}
