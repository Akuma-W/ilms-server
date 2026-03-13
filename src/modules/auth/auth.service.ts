import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { compare, hash } from 'src/common/utils/hash.util';
import { Role, UserStatus } from 'src/generated/prisma/enums';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { ConfigService } from '@nestjs/config';
import { RedisService } from 'src/infrastructures/redis/redis.service';
import { AuthUser } from './interfaces/auth-user.interface';
import { GoogleProfile } from './interfaces/google-profile.interface';
import { GoogleRegisterDto } from './dto/google-register.dto';
import { GooglePayload } from './interfaces/google-payload.interface';
import { randomUUID } from 'crypto';
import { GoogleLoginResult } from './interfaces/google-login-result.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly redis: RedisService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  // Login by email, password
  async login(user: AuthUser) {
    // Create token
    const tokens = await this.generateTokens(user.id, user.role);

    return {
      message: 'Đăng nhập thành công',
      data: {
        userId: user.id,
        ...tokens,
      },
    };
  }

  // Login by Google Account
  async googleLogin(profile: GoogleProfile): Promise<GoogleLoginResult> {
    const { email, googleId, firstName, lastName, avatar } = profile;
    const fullName = `${lastName} ${firstName}`;

    const user = await this.usersService.findByEmail(email);

    // If user existed
    if (user) {
      const tokens = await this.generateTokens(user.id, user.role);

      return {
        message: 'Đăng nhập thành công',
        type: 'LOGIN_SUCCESS',
        data: {
          userId: user.id,
          ...tokens,
        },
      };
    }

    // if user don't exist
    const tempToken = this.jwtService.sign(
      {
        email,
        googleId,
        avatar,
        fullName,
        type: 'GOOGLE_REGISTER',
      } as GooglePayload,
      {
        secret: this.config.get('auth.jwt.accessTokenSecret'),
        expiresIn: this.config.get('auth.jwt.accessExpriesIn'),
      },
    );

    return {
      message: 'Bổ sung thông tin đăng ký',
      type: 'REGISTER_REQUIRED',
      data: {
        email,
        fullName,
        avatar,
        tempToken,
      },
    };
  }

  // Register from Google
  async registerGoogleUser(token: string, dto: GoogleRegisterDto) {
    const payload = this.jwtService.verify<GooglePayload>(token, {
      secret: this.config.get<string>('auth.jwt.accessTokenSecret'),
    });

    if (payload.type !== 'GOOGLE_REGISTER') {
      throw new UnauthorizedException();
    }

    const user = await this.usersService.create({
      email: payload.email,
      googleId: payload.googleId,
      fullName: dto.fullName ?? payload.email,
      avatarUrl: payload.avatar,
      role: dto.role,
      schoolId: dto.schoolId,
      identityCode: dto.identityCode,
      status: UserStatus.active,
    });

    const tokens = await this.generateTokens(user.id, user.role);

    return {
      message: 'Đăng nhập thành công',
      data: {
        userId: user.id,
        ...tokens,
      },
    };
  }

  async refreshToken(refreshToken: string) {
    const payload: JwtPayload = await this.jwtService.verifyAsync(
      refreshToken,
      {
        secret: this.config.get<string>('auth.jwt.refreshTokenSecret'),
      },
    );

    const key = `refresh:${payload.sub}:${payload.jti}`;

    // Compare refreshToken sent and refreshToken stored
    const storedToken = await this.redis.get<string>(key);
    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const isMatch = await compare(refreshToken, storedToken);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.usersService.findOne(payload.sub);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Token rotation
    await this.redis.del(key);

    const tokens = await this.generateTokens(user.id, user.role);

    return {
      message: 'Token refreshed',
      data: tokens,
    };
  }

  async logout(userId: string, jti: string) {
    await this.redis.del(`refresh:${userId}:${jti}`);
  }

  async generateTokens(userId: string, role: Role) {
    const jti = randomUUID();

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
    const hashedToken = await hash(refreshToken);
    await this.redis.set(
      `refresh:${payload.sub}:${payload.jti}`,
      hashedToken,
      7 * 24 * 60 * 60, // 7 days
    );

    return { accessToken, refreshToken };
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
    if (!user.password) {
      throw new UnauthorizedException('Password not found');
    }

    const isMatch = await compare(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }
}
