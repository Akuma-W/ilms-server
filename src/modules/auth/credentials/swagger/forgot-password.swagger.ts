import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';

export function ApiForgotPassword() {
  return applyDecorators(
    ApiOperation({
      summary: 'Send password reset OTP to user email',
    }),
    ApiBody({
      type: ForgotPasswordDto,
    }),
    ApiResponse({
      status: 200,
      description: 'Reset password OTP sent successfully',
      schema: {
        example: {
          success: true,
          message: 'Reset password OTP sent',
          data: null,
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Email not registered',
    }),
  );
}
