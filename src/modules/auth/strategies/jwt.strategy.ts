import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { TokenService } from '../services/token.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly config: ConfigService,
    private readonly tokenService: TokenService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('auth.jwt.accessTokenSecret'),
    });
  }

  async validate(payload: JwtPayload) {
    const isBlacklisted = await this.tokenService.isBlacklisted(payload.jti);

    if (isBlacklisted) {
      throw new UnauthorizedException('Token revoked');
    }
    return {
      id: payload.sub,
      role: payload.role,
    };
  }
}
