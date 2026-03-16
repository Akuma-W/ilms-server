import {
  Body,
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
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { LoginDto } from './dto/login.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type { AuthUser } from './interfaces/auth-user.interface';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import type { GoogleProfile } from './interfaces/google-profile.interface';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

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
  @ApiOperation({
    summary: 'Login account by email and password',
  })
  @ApiBody({
    type: LoginDto,
  })
  async login(
    @CurrentUser() user: AuthUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(user);

    const { refreshToken } = result.data;

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/auth/refresh',
    });

    return result;
  }

  @Public()
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: 'Login by Google',
    description: 'Redirect user to Google OAuth to login',
  })
  @ApiResponse({
    status: 302,
    description: 'Redirect to Google Login',
  })
  async googleAuth() {}

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: 'Google OAuth callback',
    description: 'Google redirect to this endpoint after authentication',
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
  })
  async googleAuthRedirect(
    @CurrentUser() user: GoogleProfile,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.googleLogin(user);

    const frontEndUrl = `${this.config.get<string>('cors.origin')}`;

    // CASE: need register
    if (result.type === 'REGISTER_REQUIRED') {
      return res.redirect(
        `${frontEndUrl}/auth/google-register?token=${result.data.tempToken}`,
      );
    }

    // CASE: login success
    const { refreshToken } = result.data;

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: this.config.get('NODE_ENV') === 'production',
      sameSite: 'lax',
      path: '/auth/refresh',
    });

    return res.redirect(`${frontEndUrl}/auth/callback`);
  }

  @Public()
  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  async refresh(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies['refresh_token'] as string;

    const result = await this.authService.refreshToken(refreshToken);
    const { refreshToken: newToken } = result.data;

    res.cookie('refresh_token', newToken, {
      httpOnly: true,
      secure: this.config.get('NODE_ENV') === 'production',
      sameSite: 'lax',
      path: '/auth/refresh',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    return result;
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Logout account',
    description: 'Logout account and revoke tokens',
  })
  @ApiResponse({
    status: 200,
    description: 'Logout successful',
  })
  async logout(@CurrentUser() user: AuthUser, @Res() res: Response) {
    await this.authService.logout(user);

    res.clearCookie('refresh_token');

    return {
      message: 'Logout successful',
    };
  }
}
