import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { CredentialsService } from '../credentials.service';

// Passport Local Strategy for validating user credentials
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly credentialsService: CredentialsService) {
    super({
      usernameField: 'email',
      passwordField: 'password',
    });
  }

  // Delegates user credential validation to CredentialsService
  async validate(email: string, password: string) {
    const user = await this.credentialsService.validateUser(email, password);
    return user;
  }
}
