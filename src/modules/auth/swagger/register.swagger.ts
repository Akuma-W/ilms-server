import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { RegisterDto } from '../dto/register.dto';

export function ApiRegister() {
  return applyDecorators(
    ApiOperation({
      summary: 'Register with email and password',
    }),
    ApiBody({
      type: RegisterDto,
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
            accessToken: 'string',
            refreshToken: 'string',
          },
        },
      },
    }),
    ApiResponse({
      status: 409,
      description: 'Email already exists',
    }),
  );
}
