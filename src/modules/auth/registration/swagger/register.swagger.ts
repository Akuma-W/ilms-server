import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RegisterDto } from '../dto/register.dto';

export function ApiRegister() {
  return applyDecorators(
    ApiOperation({
      summary: 'Register with email and password, send verification OTP',
    }),
    ApiBody({
      type: RegisterDto,
    }),
    ApiResponse({
      status: 201,
      description: 'Registration OTP sent successfully',
      schema: {
        example: {
          success: true,
          message: 'OTP sent successfully',
          data: null,
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request or missing required fields',
    }),
    ApiResponse({
      status: 409,
      description: 'Email already exists',
    }),
  );
}
