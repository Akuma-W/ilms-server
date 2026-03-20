import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Role } from 'src/generated/prisma/enums';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from 'src/infrastructures/redis/redis.service';
import { hashToken } from 'src/common/utils/hash.util';

@Injectable()
export class TokenService {
  constructor(
    private config: ConfigService,
    private jwtService: JwtService,
    private redis: RedisService,
  ) {}

  async generateTokens(userId: string, role: Role) {
    const jti = randomUUID();
    const payload: Omit<JwtPayload, 'exp'> = { sub: userId, jti, role };

    // Unique indentifier for access token
    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.get('auth.jwt.accessTokenSecret'),
      expiresIn: this.config.get('auth.jwt.accessExpriesIn'),
    });

    // Unique identifier for the refresh token
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.config.get('auth.jwt.refreshTokenSecret'),
      expiresIn: this.config.get('auth.jwt.refreshExpiresIn'),
    });

    // Store refresh token in Redis with expiration
    const hashedToken = await hashToken(refreshToken);
    await this.redis.set(
      `refresh:${payload.sub}:${payload.jti}`,
      hashedToken,
      7 * 24 * 60 * 60, // 7 days
    );
    return { accessToken, refreshToken };
  }

  async addBlacklist(jti: string, exp: number) {
    const ttl = exp - Math.floor(Date.now() / 1000);

    await this.redis.set(`blacklist:${jti}`, true, ttl);
  }

  async isBlacklisted(jti: string): Promise<boolean> {
    const result = await this.redis.get<boolean>(`blacklist:${jti}`);

    return !!result;
  }
}
