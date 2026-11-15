import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';
import { UserEntity } from '../../entities/user.entity';

export function ApiUpdateProfile() {
  return applyDecorators(
    ApiOperation({ summary: 'Update profile information' }),
    ApiAuth(),
    ApiResponse({
      status: 200,
      description: 'Profile updated successfully',
      type: UserEntity,
    }),
    ApiResponse({
      status: 400,
      description: 'Invalid input data',
    }),
  );
}
