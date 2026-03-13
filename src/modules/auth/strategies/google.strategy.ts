import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';
import { GoogleProfile } from '../interfaces/google-profile.interface';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(config: ConfigService) {
    super({
      clientID: config.getOrThrow<string>('google.clientId'),
      clientSecret: config.getOrThrow<string>('google.clientSecret'),
      callbackURL: 'http://localhost:5000/api/v1/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
  ): GoogleProfile {
    const { id, name, emails, photos } = profile;
    const email = emails?.[0]?.value;

    if (!email) {
      throw new UnauthorizedException('Google account has no email');
    }

    return {
      googleId: id,
      email,
      firstName: name?.givenName,
      lastName: name?.familyName,
      avatar: photos?.[0]?.value,
      accessToken,
    };
  }
}
