import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ResetPasswordDto } from '../dto/reset-password.dto';

export function ApiResetPassword() {
  return applyDecorators(
    ApiOperation({
      summary: 'Verify OTP and reset account password',
    }),
    ApiBody({
      type: ResetPasswordDto,
    }),
    ApiResponse({
      status: 200,
      description: 'Password reset successfully',
      schema: {
        example: {
          success: true,
          message: 'Password reset successfully',
          data: null,
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Invalid or expired OTP',
    }),
    ApiResponse({
      status: 404,
      description: 'User not found',
    }),
  );
}
