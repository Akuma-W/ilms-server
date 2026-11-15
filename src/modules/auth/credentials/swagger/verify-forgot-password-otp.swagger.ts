import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { VerifyForgotPasswordOtpDto } from '../dto/verify-forgot-password-otp.dto';

export function ApiVerifyForgotPasswordOtp() {
  return applyDecorators(
    ApiOperation({
      summary: 'Verify forgot password OTP code before entering new password',
    }),
    ApiBody({
      type: VerifyForgotPasswordOtpDto,
    }),
    ApiResponse({
      status: 200,
      description: 'OTP code verified successfully',
      schema: {
        example: {
          success: true,
          message: 'OTP verified successfully',
          data: null,
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Invalid or expired OTP',
    }),
  );
}
