import { Injectable, UnauthorizedException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Role } from 'src/generated/prisma/enums';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from 'src/infrastructures/redis/redis.service';
import { hashToken } from 'src/common/utils/hash.util';
import { GooglePayload } from '../oauth/interfaces/google-payload.interface';

// Service managing JWT signing, verification, blacklisting, and temporary tokens
@Injectable()
export class TokenService {
  constructor(
    private readonly config: ConfigService,
    private readonly jwtService: JwtService,
    private readonly redis: RedisService,
  ) {}

  // Generates access and refresh token pair and stores refresh hash in Redis
  async generateTokens(userId: string, role: Role) {
    const jti = randomUUID();
    const payload: Omit<JwtPayload, 'exp'> = { sub: userId, jti, role };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.get('auth.jwt.accessTokenSecret'),
      expiresIn: this.config.get('auth.jwt.accessExpriesIn'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.config.get('auth.jwt.refreshTokenSecret'),
      expiresIn: this.config.get('auth.jwt.refreshExpiresIn'),
    });

    const hashedToken = await hashToken(refreshToken);
    await this.redis.set(
      `refresh:${payload.sub}:${payload.jti}`,
      hashedToken,
      7 * 24 * 60 * 60, // 7 days
    );
    return { accessToken, refreshToken };
  }

  // Verifies signature and payload of a refresh token
  async verifyRefreshToken(refreshToken: string): Promise<JwtPayload> {
    return await this.jwtService.verifyAsync(refreshToken, {
      secret: this.config.get<string>('auth.jwt.refreshTokenSecret'),
    });
  }

  // Adds an access token JTI to the Redis blacklist until its expiration
  async addBlacklist(jti: string, exp: number): Promise<void> {
    const ttl = exp - Math.floor(Date.now() / 1000);
    if (ttl > 0) {
      await this.redis.set(`blacklist:${jti}`, true, ttl);
    }
  }

  // Checks whether a token JTI has been revoked
  async isBlacklisted(jti: string): Promise<boolean> {
    const result = await this.redis.get<boolean>(`blacklist:${jti}`);
    return !!result;
  }

  // Generates temporary token for Google OAuth onboarding flow
  generateTempToken(data: GooglePayload): string {
    return this.jwtService.sign(
      {
        ...data,
        type: 'GOOGLE_REGISTER',
      },
      {
        secret: this.config.get('auth.jwt.tempTokenSecret'),
        expiresIn: this.config.get('auth.jwt.tempExpriesIn'),
      },
    );
  }

  // Verifies temporary Google onboarding token
  async verifyTempToken(token: string): Promise<GooglePayload> {
    try {
      const payload = await this.jwtService.verifyAsync<GooglePayload>(token, {
        secret: this.config.get<string>('auth.jwt.tempTokenSecret'),
      });

      if (payload.type !== 'GOOGLE_REGISTER') {
        throw new UnauthorizedException('Invalid token type');
      }

      return payload;
    } catch {
      throw new UnauthorizedException('Token expired or invalid');
    }
  }
}
