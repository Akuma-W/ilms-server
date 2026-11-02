import { Module } from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { AuthController } from './auth.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';
import { GoogleStrategy } from './strategies/google.strategy';
import { TokenService } from './services/token.service';
import { OauthService } from './services/oauth.service';
import { SessionService } from './services/session.service';

@Module({
  providers: [
    AuthService,
    TokenService,
    OauthService,
    SessionService,
    JwtStrategy,
    LocalStrategy,
    GoogleStrategy,
  ],
  controllers: [AuthController],
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return {
          secret: config.get<string>('auth.jwt.accessTokenSecret'),
          signOptions: {
            expiresIn: config.get('auth.jwt.accessExpriesIn'),
          },
        };
      },
    }),
    UsersModule,
  ],
  exports: [JwtStrategy, LocalStrategy, PassportModule, JwtModule],
})
export class AuthModule {}
