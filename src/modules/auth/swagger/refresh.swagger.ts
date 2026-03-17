import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiOkResponse } from '@nestjs/swagger';

export function ApiRefresh() {
  return applyDecorators(
    ApiOperation({
      summary: 'Refresh access token using refresh token',
    }),
    ApiOkResponse({
      description: 'Token refreshed successfully',
    }),
  );
}
