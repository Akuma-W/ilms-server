import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { VerifyRegistrationOtpDto } from '../dto/verify-registration-otp.dto';

export function ApiVerifyRegistrationOtp() {
  return applyDecorators(
    ApiOperation({
      summary: 'Verify registration OTP and create official user account',
    }),
    ApiBody({
      type: VerifyRegistrationOtpDto,
    }),
    ApiResponse({
      status: 201,
      description: 'User registered and activated successfully',
      schema: {
        example: {
          success: true,
          message: 'User registered successfully',
          data: {
            userId: '133c7575-1b40-4ba3-9a24-9484964b9a24',
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Invalid or expired registration OTP code',
    }),
  );
}
