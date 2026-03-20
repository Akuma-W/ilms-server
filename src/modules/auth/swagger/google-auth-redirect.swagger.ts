import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiGoogleAuthRedirect() {
  return applyDecorators(
    ApiOperation({
      summary: 'Google OAuth callback',
      description: 'Google redirect to this endpoint after authentication',
    }),
    ApiResponse({
      status: 200,
      description: 'Login successful',
    }),
  );
}
