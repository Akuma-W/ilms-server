import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from 'src/modules/users/users.service';
import { TokenService } from '../session/token.service';
import { GoogleProfile } from './interfaces/google-profile.interface';
import { Role, UserStatus } from 'src/generated/prisma/enums';
import { UserResponseDto } from 'src/modules/users/dto/user-response.dto';
import { GoogleRegisterDto } from './dto/google-register.dto';
import { GoogleLoginResult } from './interfaces/google-login-result.interface';
import { GooglePayload } from './interfaces/google-payload.interface';

// Service managing Google OAuth2 authentication flow, profile linking, and onboarding
@Injectable()
export class OauthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly tokenService: TokenService,
  ) {}

  // Authenticates user via Google Profile and determines whether onboarding is required
  async googleLogin(profile: GoogleProfile): Promise<GoogleLoginResult> {
    const { email, googleId, firstName, lastName, avatar } = profile;
    const fullName = `${lastName ?? ''} ${firstName ?? ''}`.trim();

    const user = await this.usersService.findByEmail(email);

    if (user) {
      if (user.status === UserStatus.locked) {
        throw new UnauthorizedException('User is locked');
      }

      if (user.status === UserStatus.banned) {
        throw new UnauthorizedException('User is banned');
      }

      await this.handleLinkGoogle(user, googleId, avatar);

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

  // Retrieves verified temporary Google profile details from onboarding token
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

  // Completes profile registration for Google OAuth user
  async registerGoogleUser(token: string, dto: GoogleRegisterDto) {
    const payload = await this.tokenService.verifyTempToken(token);

    this.validateIdentity(dto.role, dto.identityCode);

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

  // Validates role permissions and role-specific student identity requirement
  private validateIdentity(role: Role, identityCode?: string) {
    if (role !== Role.student && role !== Role.teacher) {
      throw new ForbiddenException(
        'Only student and teacher roles are allowed for OAuth registration',
      );
    }

    if (role === Role.student && !identityCode) {
      throw new BadRequestException('Identity Code is required for student');
    }
  }

  // Associates Google ID and syncs avatar if absent
  private async handleLinkGoogle(
    user: {
      id: string;
      googleId: string | null;
      avatarUrl: string | null;
    },
    googleId: string,
    avatar?: string,
  ) {
    const updateData: Record<string, unknown> = {};

    if (!user.googleId) {
      updateData.googleId = googleId;
    }

    if (!user.avatarUrl && avatar) {
      updateData.avatarUrl = avatar;
    }

    if (Object.keys(updateData).length > 0) {
      await this.usersService.update(user.id, updateData);
    }
  }

  // Checks whether mandatory profile fields are fully completed
  private isProfileComplete(user: UserResponseDto) {
    if (user.role === Role.admin) {
      return true;
    }

    const isStudentComplete = user.role === Role.student && !!user.identityCode;
    const isTeacherComplete = user.role === Role.teacher;

    return (
      user.schoolId && user.role && (isStudentComplete || isTeacherComplete)
    );
  }

  // Provisions new user account in database from Google profile and onboarding DTO
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
