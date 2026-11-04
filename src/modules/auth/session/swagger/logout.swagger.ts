import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';

export function ApiLogout() {
  return applyDecorators(
    ApiAuth(),
    ApiOperation({
      summary: 'Logout account',
      description: 'Logout account and revoke tokens',
    }),
    ApiResponse({
      status: 200,
      description: 'Logout successful',
    }),
  );
}
