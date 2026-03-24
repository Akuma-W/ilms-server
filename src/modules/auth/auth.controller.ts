import {
  Controller,
  Get,
  Logger,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { AuthService } from './services/auth.service';
import { ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { Public } from 'src/common/decorators/public.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type { AuthUser } from './interfaces/auth-user.interface';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import type { GoogleProfile } from './interfaces/google-profile.interface';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ApiLogin } from './swagger/login.swagger';
import { ApiGoogleAuth } from './swagger/google-auth.swagger';
import { ApiGoogleAuthRedirect } from './swagger/google-auth-redirect.swagger';
import { ApiLogout } from './swagger/logout.swagger';
import { ApiRefresh } from './swagger/refresh.swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Post('login')
  @UseGuards(LocalAuthGuard)
  @ApiLogin()
  async login(
    @CurrentUser() user: AuthUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(user);
    const { refreshToken, accessToken } = result;

    this.setTokensToCookies(res, accessToken, refreshToken);

    return {
      message: 'Login successful',
      data: result,
    };
  }

  @Public()
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiGoogleAuth()
  async googleAuth() {}

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiGoogleAuthRedirect()
  async googleAuthRedirect(
    @CurrentUser() user: GoogleProfile,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.googleLogin(user);

    const frontEndUrl = `${this.config.get<string>('cors.origin')}`;

    // CASE: need register
    if (result.action === 'REGISTER_REQUIRED') {
      return res.redirect(
        `${frontEndUrl}/auth/google-register?token=${result.data.tempToken}`,
      );
    }

    // CASE: login success
    const { refreshToken, accessToken } = result.data;

    this.setTokensToCookies(res, accessToken, refreshToken);

    return res.redirect(`${frontEndUrl}/auth/callback`);
  }

  @Public()
  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  @ApiRefresh()
  async refresh(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies['refresh_token'] as string;

    const result = await this.authService.refreshToken(refreshToken);
    const { refreshToken: newToken, accessToken } = result;

    this.setTokensToCookies(res, accessToken, newToken);

    return { message: 'Refresh successful' };
  }

  @Post('logout')
  @ApiLogout()
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const user = req.user as AuthUser;
    const token = req.cookies['accessToken'] as string;

    await this.authService.logout(user, token);

    res.clearCookie('refresh_token');
    res.clearCookie('access_token');

    return { message: 'Logout successful' };
  }

  private setTokensToCookies(
    @Res({ passthrough: true }) res: Response,
    accessToken: string,
    refreshToken: string,
  ) {
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: this.config.get('NODE_ENV') === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7d
    });

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: this.config.get('NODE_ENV') === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15m
    });
  }
}
