import { Injectable, UnauthorizedException } from '@nestjs/common';
import { compareToken } from 'src/common/utils/hash.util';
import { AuthUser } from '../interfaces/auth-user.interface';
import { RedisService } from 'src/infrastructures/redis/redis.service';
import { UsersService } from 'src/modules/users/users.service';
import { TokenService } from './token.service';

@Injectable()
export class SessionService {
  constructor(
    private readonly redis: RedisService,
    private readonly usersService: UsersService,
    private readonly tokenService: TokenService,
  ) {}

  async refreshToken(refreshToken: string) {
    const payload = await this.tokenService.verifyRefreshToken(refreshToken);

    const key = `refresh:${payload.sub}:${payload.jti}`;

    // Compare refreshToken sent and refreshToken stored
    const storedToken = await this.redis.get<string>(key);
    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const isMatch = await compareToken(refreshToken, storedToken);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.usersService.findOne(payload.sub);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Token rotation
    await this.redis.del(key);

    const tokens = await this.tokenService.generateTokens(user.id, user.role);

    return tokens;
  }

  async logout(user: AuthUser, token: string) {
    // save access token to blacklist
    await this.tokenService.addBlacklist(token, user.exp);

    // revoke refresh token
    await this.redis.del(`refresh:${user.id}:${user.jti}`);
  }
}
