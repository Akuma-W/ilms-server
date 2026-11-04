import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { Public } from 'src/common/decorators/public.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

import { OauthService } from './oauth.service';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { GoogleRegisterDto } from './dto/google-register.dto';
import type { GoogleProfile } from './interfaces/google-profile.interface';
import { ApiGoogleAuth } from './swagger/google-auth.swagger';
import { ApiGoogleAuthRedirect } from './swagger/google-auth-redirect.swagger';
import { ApiGoogleAuthRegister } from './swagger/google-auth-register.swagger';
import { ApiGoogleAuthMe } from './swagger/google-auth-me.swagger';
import {
  COOKIE_KEYS,
  clearTempCookie,
  setAuthCookies,
  setTempCookie,
} from '../session/utils/cookie.util';

// Controller managing Google OAuth2 authentication flow and profile onboarding
@ApiTags('Auth')
@Throttle({
  default: {
    limit: 10,
    ttl: 60,
  },
})
@Controller('auth')
export class OauthController {
  constructor(
    private readonly oauthService: OauthService,
    private readonly config: ConfigService,
  ) {}

  // Initiates Google OAuth2 login redirect
  @Public()
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiGoogleAuth()
  async googleAuth() {}

  // Handles Google OAuth2 callback and redirects to frontend
  @Public()
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiGoogleAuthRedirect()
  async googleAuthRedirect(
    @CurrentUser() user: GoogleProfile,
    @Res({ passthrough: true }) res: Response,
  ) {
    const frontEndUrl = `${this.config.get<string>('cors.origin')}`;

    try {
      const result = await this.oauthService.googleLogin(user);

      if (result.action === 'REGISTER_REQUIRED') {
        setTempCookie(res, this.config, result.data.tempToken);
        return res.redirect(`${frontEndUrl}/google/register`);
      }

      const { refreshToken, accessToken } = result.data;
      setAuthCookies(res, this.config, accessToken, refreshToken);

      return res.redirect(`${frontEndUrl}/google/callback`);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'OAuth authentication failed';
      return res.redirect(
        `${frontEndUrl}/login?error=${encodeURIComponent(message)}`,
      );
    }
  }

  // Retrieves temporary Google user info from onboarding token
  @Public()
  @Get('google/me')
  @ApiGoogleAuthMe()
  async getGoogleTempUser(@Req() req: Request) {
    const tempToken = req.cookies[COOKIE_KEYS.TEMP] as string;
    const data = await this.oauthService.getGoogleUser(tempToken);

    return { message: 'Get google temp user', data };
  }

  // Completes profile registration for Google OAuth user
  @Public()
  @Post('google/register')
  @ApiGoogleAuthRegister()
  async registerGoogle(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() dto: GoogleRegisterDto,
  ) {
    const tempToken = req.cookies[COOKIE_KEYS.TEMP] as string;

    if (!tempToken) {
      throw new UnauthorizedException('Missing temp token');
    }

    const result = await this.oauthService.registerGoogleUser(tempToken, dto);
    const { refreshToken, accessToken } = result;

    setAuthCookies(res, this.config, accessToken, refreshToken);
    clearTempCookie(res, this.config);

    return {
      message: 'Register successful',
      data: {
        userId: result.userId,
        accessToken: result.accessToken,
      },
    };
  }
}
