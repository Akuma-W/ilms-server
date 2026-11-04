import { Body, Controller, Patch, Post, Res, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { Public } from 'src/common/decorators/public.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

import { CredentialsService } from './credentials.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ApiLogin } from './swagger/login.swagger';
import { ApiForgotPassword } from './swagger/forgot-password.swagger';
import { ApiResetPassword } from './swagger/reset-password.swagger';
import { ApiChangePassword } from './swagger/change-password.swagger';
import type { AuthUser } from '../session/interfaces/auth-user.interface';
import { setAuthCookies } from '../session/utils/cookie.util';

// Controller managing local user authentication and password operations
@ApiTags('Auth')
@Throttle({
  default: {
    limit: 10,
    ttl: 60,
  },
})
@Controller('auth')
export class CredentialsController {
  constructor(
    private readonly credentialsService: CredentialsService,
    private readonly config: ConfigService,
  ) {}

  // Authenticates with email and password via LocalAuthGuard
  @Public()
  @Post('login')
  @UseGuards(LocalAuthGuard)
  @ApiLogin()
  async login(
    @CurrentUser() user: AuthUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.credentialsService.login(user);
    const { userId, refreshToken, accessToken } = result;

    setAuthCookies(res, this.config, accessToken, refreshToken);

    return {
      message: 'Login successful',
      data: { userId, accessToken },
    };
  }

  // Requests password reset OTP via registered email
  @Public()
  @Post('forgot-password')
  @ApiForgotPassword()
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    const result = await this.credentialsService.sendForgotPasswordOtp(dto);

    return {
      message: result.message,
      data: null,
    };
  }

  // Verifies reset OTP and updates user password
  @Public()
  @Post('reset-password')
  @ApiResetPassword()
  async resetPassword(@Body() dto: ResetPasswordDto) {
    const result = await this.credentialsService.resetPassword(dto);

    return {
      message: result.message,
      data: null,
    };
  }

  // Changes password for currently authenticated user and revokes sessions
  @Patch('change-password')
  @ApiChangePassword()
  async changePassword(
    @CurrentUser() user: AuthUser,
    @Body() dto: ChangePasswordDto,
  ) {
    const result = await this.credentialsService.changePassword(user.id, dto);

    return {
      message: result.message,
      data: null,
    };
  }
}
