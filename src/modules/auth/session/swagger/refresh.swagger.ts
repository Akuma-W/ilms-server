import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';

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
