import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from 'src/common/decorators/public.decorator';
import { RegistrationService } from './registration.service';
import { RegisterDto } from './dto/register.dto';
import { VerifyRegistrationOtpDto } from './dto/verify-registration-otp.dto';
import { ResendRegistrationOtpDto } from './dto/resend-registration-otp.dto';
import { ApiRegister } from './swagger/register.swagger';
import { ApiVerifyRegistrationOtp } from './swagger/verify-registration-otp.swagger';
import { ApiResendRegistrationOtp } from './swagger/resend-registration-otp.swagger';

// Controller dedicated to account registration and registration OTP verification
@ApiTags('Auth')
@Throttle({
  default: {
    limit: 10,
    ttl: 60,
  },
})
@Controller('auth')
export class RegistrationController {
  constructor(private readonly registrationService: RegistrationService) {}

  // Registers initial user details and sends registration OTP
  @Public()
  @Post('register')
  @ApiRegister()
  async register(@Body() dto: RegisterDto) {
    const result = await this.registrationService.register(dto);

    return {
      message: result.message,
      data: null,
    };
  }

  // Verifies registration OTP and creates permanent user account
  @Public()
  @Post('register/verify-otp')
  @ApiVerifyRegistrationOtp()
  async verifyRegistrationOtp(@Body() dto: VerifyRegistrationOtpDto) {
    const result = await this.registrationService.verifyRegistrationOtp(dto);

    return {
      message: 'User registered successfully',
      data: result,
    };
  }

  // Resends new OTP code for pending registration
  @Public()
  @Post('register/resend-otp')
  @ApiResendRegistrationOtp()
  async resendRegistrationOtp(@Body() dto: ResendRegistrationOtpDto) {
    const result = await this.registrationService.resendRegistrationOtp(dto);

    return {
      message: result.message,
      data: null,
    };
  }
}
