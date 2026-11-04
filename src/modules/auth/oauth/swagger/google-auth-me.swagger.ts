import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiGoogleAuthMe() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get Google onboarding profile',
      description:
        'Retrieves verified profile data stored in temporary onboarding cookie',
    }),
    ApiResponse({
      status: 200,
      description: 'Profile data retrieved successfully',
      schema: {
        example: {
          success: true,
          message: 'Get google temp user',
          data: {
            email: 'user@example.com',
            fullName: 'Nguyen Van A',
            avatar: 'https://lh3.googleusercontent.com/...',
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Token is invalid or expired',
    }),
  );
}
