import { Injectable, UnauthorizedException } from '@nestjs/common';
import { compareToken } from 'src/common/utils/hash.util';
import { AuthUser } from './interfaces/auth-user.interface';
import { RedisService } from 'src/infrastructures/redis/redis.service';
import { UsersService } from 'src/modules/users/users.service';
import { TokenService } from './token.service';

// Service managing active user sessions, token rotation, and session invalidation
@Injectable()
export class SessionService {
  constructor(
    private readonly redis: RedisService,
    private readonly usersService: UsersService,
    private readonly tokenService: TokenService,
  ) {}

  // Rotates refresh token and generates new auth tokens
  async refreshToken(refreshToken: string) {
    const payload = await this.tokenService.verifyRefreshToken(refreshToken);
    const key = `refresh:${payload.sub}:${payload.jti}`;

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

    await this.redis.del(key);
    const tokens = await this.tokenService.generateTokens(user.id, user.role);

    return tokens;
  }

  // Logs out user by blacklisting current access token and deleting refresh session
  async logout(user: AuthUser, token: string): Promise<void> {
    await this.tokenService.addBlacklist(token, user.exp);
    await this.redis.del(`refresh:${user.id}:${user.jti}`);
  }

  // Revokes all active refresh token sessions for a specific user
  async clearUserSessions(userId: string): Promise<void> {
    const client = this.redis.getClient();
    const pattern = `refresh:${userId}:*`;
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(...keys);
    }
  }
}
