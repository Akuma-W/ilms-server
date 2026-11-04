import {
  Controller,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { Public } from 'src/common/decorators/public.decorator';

import { SessionService } from './session.service';
import type { AuthUser } from './interfaces/auth-user.interface';
import { ApiRefresh } from './swagger/refresh.swagger';
import { ApiLogout } from './swagger/logout.swagger';
import {
  clearAuthCookies,
  COOKIE_KEYS,
  setAuthCookies,
} from './utils/cookie.util';

// Controller managing token refreshing and user session revocation
@ApiTags('Auth')
@Throttle({
  default: {
    limit: 10,
    ttl: 60,
  },
})
@Controller('auth')
export class SessionController {
  constructor(
    private readonly sessionService: SessionService,
    private readonly config: ConfigService,
  ) {}

  // Refreshes expired access token using refresh token from cookies
  @Public()
  @Post('refresh')
  @ApiRefresh()
  async refresh(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies[COOKIE_KEYS.REFRESH] as string;

    const result = await this.sessionService.refreshToken(refreshToken);
    const { refreshToken: newToken, accessToken } = result;

    setAuthCookies(res, this.config, accessToken, newToken);

    return { message: 'Refresh successful' };
  }

  // Revokes current user session and clears authentication cookies
  @Post('logout')
  @ApiLogout()
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const user = req.user as AuthUser;
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    await this.sessionService.logout(user, token);

    clearAuthCookies(res, this.config);

    return { message: 'Logout successful' };
  }
}
