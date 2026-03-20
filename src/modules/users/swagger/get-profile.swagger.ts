import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';

export function ApiGetProfile() {
  return applyDecorators(
    ApiOperation({ summary: 'Get current user profile' }),
    ApiAuth(),
    ApiResponse({
      status: 200,
      description: 'Current user profile fetched successfully',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized',
    }),
  );
}
