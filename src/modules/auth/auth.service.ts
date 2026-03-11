import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { comparePassword } from 'src/common/utils/hash.util';
import { Role, UserStatus } from 'src/generated/prisma/enums';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { ConfigService } from '@nestjs/config';
import { RedisService } from 'src/infrastructures/redis/redis.service';
import { AuthUser } from './interfaces/auth-user.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly redis: RedisService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async login(user: AuthUser) {
    // Create token
    const tokens = await this.generateTokens(user.id, user.role);

    return {
      message: 'Đăng nhập thành công',
      data: {
        userId: user.id,
        accessToken: tokens.accessToken,
      },
    };
  }

  async generateTokens(userId: string, role: Role) {
    const jti = Date.now().toString();

    const payload: JwtPayload = { sub: userId, jti, role };

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
    await this.redis.set(
      `refresh:${payload.sub}:${payload.jti}`,
      refreshToken,
      7 * 24 * 60 * 60, // 7 days
    );

    return { accessToken };
  }

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);

    // Check if user exists
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if users is active
    if (user.status === UserStatus.locked) {
      throw new UnauthorizedException('User is locked');
    }

    if (user.status === UserStatus.banned) {
      throw new UnauthorizedException('User is banned');
    }

    // Check password
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }
}
