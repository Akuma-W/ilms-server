import {
  Body,
  Controller,
  Get,
  Logger,
  Post,
  Req,
  Res,
  UnauthorizedException,
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
import { ApiLogin } from './swagger/login.swagger';
import { ApiGoogleAuth } from './swagger/google-auth.swagger';
import { ApiGoogleAuthRedirect } from './swagger/google-auth-redirect.swagger';
import { ApiLogout } from './swagger/logout.swagger';
import { ApiRefresh } from './swagger/refresh.swagger';
import { OauthService } from './services/oauth.service';
import { SessionService } from './services/session.service';
import { RegisterDto } from './dto/register.dto';
import { GoogleRegisterDto } from './dto/google-register.dto';
import { ApiGoogleAuthRegister } from './swagger/google-auth-register.swagger';
import { ApiRegister } from './swagger/register.swagger';
import { Throttle } from '@nestjs/throttler';

const COOKIE_KEYS = {
  ACCESS: 'access_token',
  REFRESH: 'refresh_token',
  TEMP: 'temp_token',
};

@ApiTags('Auth')
@Throttle({
  default: {
    limit: 10,
    ttl: 60,
  },
})
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  constructor(
    private readonly authService: AuthService,
    private readonly oauthService: OauthService,
    private readonly sessionService: SessionService,
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
  @Post('register')
  @ApiRegister()
  async register(@Body() dto: RegisterDto) {
    const result = await this.authService.register(dto);

    return {
      message: 'Register successful',
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
    const result = await this.oauthService.googleLogin(user);
    const frontEndUrl = `${this.config.get<string>('cors.origin')}`;

    // CASE: need register
    if (result.action === 'REGISTER_REQUIRED') {
      res.cookie(COOKIE_KEYS.TEMP, result.data.tempToken, {
        httpOnly: true,
        secure: this.config.get('NODE_ENV') === 'production',
        sameSite: 'lax',
        maxAge: 10 * 60 * 1000, // 10m
      });

      return res.redirect(`${frontEndUrl}/google/register`);
    }

    // CASE: login success
    const { refreshToken, accessToken } = result.data;

    this.setTokensToCookies(res, accessToken, refreshToken);

    return res.redirect(`${frontEndUrl}/google/callback`);
  }

  @Public()
  @Get('google/me')
  async getGoogleTempUser(@Req() req: Request) {
    const tempToken = req.cookies[COOKIE_KEYS.TEMP] as string;

    const data = await this.oauthService.getGoogleUser(tempToken);

    return { message: 'Get google temp user', data };
  }

  @Public()
  @Post('google/register')
  @ApiGoogleAuthRegister()
  async registerGoogle(@Req() req: Request, @Body() dto: GoogleRegisterDto) {
    const tempToken = req.cookies[COOKIE_KEYS.TEMP] as string;

    if (!tempToken) {
      throw new UnauthorizedException('Missing temp token');
    }

    const result = await this.oauthService.registerGoogleUser(tempToken, dto);

    return {
      message: 'Register successful',
      data: result,
    };
  }

  @Public()
  @Post('refresh')
  @ApiRefresh()
  async refresh(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies[COOKIE_KEYS.REFRESH] as string;

    const result = await this.sessionService.refreshToken(refreshToken);
    const { refreshToken: newToken, accessToken } = result;

    this.setTokensToCookies(res, accessToken, newToken);

    return { message: 'Refresh successful' };
  }

  @Post('logout')
  @ApiLogout()
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const user = req.user as AuthUser;
    const authHeader = req.headers.authorization;
    const cookieOptions = this.cookieOptions();

    if (!authHeader) {
      throw new UnauthorizedException('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');

    await this.sessionService.logout(user, token);

    res.clearCookie(COOKIE_KEYS.REFRESH, cookieOptions);
    res.clearCookie(COOKIE_KEYS.ACCESS, cookieOptions);

    return { message: 'Logout successful' };
  }

  private setTokensToCookies(
    @Res({ passthrough: true }) res: Response,
    accessToken: string,
    refreshToken: string,
  ) {
    const cookieOptions = this.cookieOptions();

    res.cookie(COOKIE_KEYS.REFRESH, refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7d
    });

    res.cookie(COOKIE_KEYS.ACCESS, accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000, // 15m
    });
  }

  private cookieOptions() {
    return {
      httpOnly: true,
      secure: this.config.get('NODE_ENV') === 'production',
      sameSite: 'lax' as const,
      path: '/',
    };
  }
}
