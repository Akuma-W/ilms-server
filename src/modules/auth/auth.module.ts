import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';

import { UsersModule } from '../users/users.module';
import { NotificationModule } from 'src/infrastructures/notification/notification.module';

import { OtpService } from './otp/otp.service';

import { RegistrationController } from './registration/registration.controller';
import { RegistrationService } from './registration/registration.service';

import { CredentialsController } from './credentials/credentials.controller';
import { CredentialsService } from './credentials/credentials.service';
import { LocalStrategy } from './credentials/strategies/local.strategy';

import { OauthController } from './oauth/oauth.controller';
import { OauthService } from './oauth/oauth.service';
import { GoogleStrategy } from './oauth/strategies/google.strategy';

import { SessionController } from './session/session.controller';
import { SessionService } from './session/session.service';
import { TokenService } from './session/token.service';
import { JwtStrategy } from './session/strategies/jwt.strategy';

@Module({
  controllers: [
    RegistrationController,
    CredentialsController,
    OauthController,
    SessionController,
  ],
  providers: [
    OtpService,
    RegistrationService,
    CredentialsService,
    OauthService,
    SessionService,
    TokenService,
    JwtStrategy,
    LocalStrategy,
    GoogleStrategy,
  ],
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
    NotificationModule,
  ],
  exports: [
    JwtStrategy,
    LocalStrategy,
    PassportModule,
    JwtModule,
    SessionService,
    TokenService,
    OtpService,
  ],
})
export class AuthModule {}
