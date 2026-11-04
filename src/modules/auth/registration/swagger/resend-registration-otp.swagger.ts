import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ResendRegistrationOtpDto } from '../dto/resend-registration-otp.dto';

export function ApiResendRegistrationOtp() {
  return applyDecorators(
    ApiOperation({
      summary: 'Resend registration OTP verification code',
    }),
    ApiBody({
      type: ResendRegistrationOtpDto,
    }),
    ApiResponse({
      status: 200,
      description: 'Registration OTP code resent successfully',
      schema: {
        example: {
          success: true,
          message: 'Registration OTP resent successfully',
          data: null,
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Pending registration not found or OTP expired',
    }),
  );
}
