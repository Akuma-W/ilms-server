import { BadRequestException, Injectable } from '@nestjs/common';
import { UsersService } from 'src/modules/users/users.service';
import { TokenService } from './token.service';
import { GoogleProfile } from '../interfaces/google-profile.interface';
import { UserStatus } from 'src/generated/prisma/enums';
import { UserResponseDto } from 'src/modules/users/dto/user-response.dto';
import { GoogleRegisterDto } from '../dto/google-register.dto';
import { GoogleLoginResult } from '../interfaces/google-login-result.interface';
import { GooglePayload } from '../interfaces/google-payload.interface';
import { AuthService } from './auth.service';

// Service for Oauth: Google
@Injectable()
export class OauthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly tokenService: TokenService,
    private readonly authService: AuthService,
  ) {}

  // Login by Google Account
  async googleLogin(profile: GoogleProfile): Promise<GoogleLoginResult> {
    const { email, googleId, firstName, lastName, avatar } = profile;
    const fullName = `${lastName} ${firstName}`;

    const user = await this.usersService.findByEmail(email);

    // If user existed
    if (user) {
      // Save googleId
      await this.handleLinkGoogle(user.id, user.googleId, googleId);

      if (this.isProfileComplete(user)) {
        const tokens = await this.tokenService.generateTokens(
          user.id,
          user.role,
        );

        return {
          action: 'LOGIN',
          data: {
            userId: user.id,
            ...tokens,
          },
        };
      }
    }

    // CASE 2: if user don't exist or completed
    const tempToken = this.tokenService.generateTempToken({
      email,
      googleId,
      avatar,
      fullName,
    });

    return {
      action: 'REGISTER_REQUIRED',
      data: {
        email,
        fullName,
        avatar,
        tempToken,
      },
    };
  }

  async getGoogleUser(token: string) {
    const payload = await this.tokenService.verifyTempToken(token);

    if (!payload) {
      throw new BadRequestException('Token is invalid or expired');
    }

    return {
      email: payload.email,
      fullName: payload.fullName,
      avatar: payload.avatar,
    };
  }

  // Register from Google
  async registerGoogleUser(token: string, dto: GoogleRegisterDto) {
    const payload = await this.tokenService.verifyTempToken(token);

    this.authService.validateIdentity(dto.role, dto.identityCode);

    let user: UserResponseDto | null = await this.usersService.findByEmail(
      payload.email,
    );

    if (user) {
      if (this.isProfileComplete(user)) {
        throw new BadRequestException('User already registered');
      }

      user = await this.usersService.update(user.id, {
        email: payload.email,
        googleId: payload.googleId,
        fullName: dto.fullName ?? payload.fullName,
        avatarUrl: payload.avatar,
        role: dto.role,
        schoolId: dto.schoolId,
        identityCode: dto.identityCode,
        status: UserStatus.active,
      });
    } else {
      user = await this.createUserFromGoogle(payload, dto);
    }

    const tokens = await this.tokenService.generateTokens(user.id, user.role);

    return {
      userId: user.id,
      ...tokens,
    };
  }

  /** HELPER: Handle Link Google */
  private async handleLinkGoogle(
    userId: string,
    existingGoogleId: string | null,
    googleId: string,
  ) {
    if (!existingGoogleId) {
      await this.usersService.update(userId, { googleId });
    }
  }

  /** HELPER: Check if profile is completed */
  private isProfileComplete(user: UserResponseDto) {
    if (user.role === 'admin') {
      return true;
    }

    const isStudentComplete = user.role === 'student' && !!user.identityCode;
    const isTeacherComplete = user.role === 'teacher';

    return (
      user.schoolId && user.role && (isStudentComplete || isTeacherComplete)
    );
  }

  /** HELPER: Create user from Google Info */
  private async createUserFromGoogle(
    payload: GooglePayload,
    dto: GoogleRegisterDto,
  ) {
    return await this.usersService.create({
      email: payload.email,
      googleId: payload.googleId,
      fullName: dto.fullName ?? payload.fullName,
      avatarUrl: payload.avatar,
      role: dto.role,
      schoolId: dto.schoolId,
      identityCode: dto.identityCode,
      status: UserStatus.active,
    });
  }
}
