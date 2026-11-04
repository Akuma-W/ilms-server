import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { LoginDto } from '../dto/login.dto';

export function ApiLogin() {
  return applyDecorators(
    ApiOperation({
      summary: 'Login account by email and password',
    }),
    ApiBody({
      type: LoginDto,
    }),
    ApiOkResponse({
      description: 'Login successful, returns auth tokens and user info',
      schema: {
        example: {
          success: true,
          message: 'Login successful',
          data: {
            userId: '133c7575-1b40-4ba3-9a24-9484964b9a24',
            accessToken: 'eyJhbGciOi...',
            refreshToken: 'eyJhbGciOi...',
          },
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Invalid credentials or user is locked/banned',
    }),
  );
}
