import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiGoogleAuth() {
  return applyDecorators(
    ApiOperation({
      summary: 'Login by Google',
      description: 'Redirect user to Google OAuth to login',
    }),
    ApiResponse({
      status: 302,
      description: 'Redirect to Google Login',
    }),
  );
}
