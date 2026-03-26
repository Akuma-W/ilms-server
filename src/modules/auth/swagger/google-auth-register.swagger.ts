import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { GoogleRegisterDto } from '../dto/google-register.dto';

export function ApiGoogleAuthRegister() {
  return applyDecorators(
    ApiOperation({
      summary: 'Complete Google registration',
      description: 'Use temp token from Google login to complete profile',
    }),
    ApiBody({
      type: GoogleRegisterDto,
    }),
    ApiResponse({
      status: 201,
      description: 'Register successful',
      schema: {
        example: {
          success: true,
          message: 'Register successful',
          data: {
            userId: 'uuid',
            accessToken: 'jwt',
            refreshToken: 'jwt',
          },
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Invalid or expired temp token',
    }),

    ApiResponse({
      status: 400,
      description: 'Invalid input or already registered',
    }),
  );
}
