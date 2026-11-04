import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { comparePasword, hashPassword } from 'src/common/utils/hash.util';
import { UserStatus } from 'src/generated/prisma/enums';
import { UsersService } from 'src/modules/users/users.service';
import { AuthUser } from '../session/interfaces/auth-user.interface';
import { TokenService } from '../session/token.service';
import { OtpService } from '../otp/otp.service';
import { NotificationFacade } from 'src/infrastructures/notification/notification.facade';
import { SessionService } from '../session/session.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

// Service managing user credentials, password lifecycle, and authentication validation
@Injectable()
export class CredentialsService {
  private readonly logger = new Logger(CredentialsService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly tokenService: TokenService,
    private readonly otpService: OtpService,
    private readonly notificationFacade: NotificationFacade,
    private readonly sessionService: SessionService,
  ) {}

  // Validates user credentials, status, and password hash for local login
  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status === UserStatus.locked) {
      throw new UnauthorizedException('User is locked');
    }

    if (user.status === UserStatus.banned) {
      throw new UnauthorizedException('User is banned');
    }

    if (!user.password) {
      throw new UnauthorizedException('Password not found');
    }

    const isMatch = await comparePasword(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  // Generates access and refresh tokens for validated user
  async login(user: AuthUser) {
    const tokens = await this.tokenService.generateTokens(user.id, user.role);

    return {
      userId: user.id,
      ...tokens,
    };
  }

  // Dispatches forgot password OTP code to registered user email
  async sendForgotPasswordOtp(dto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new NotFoundException('Email not registered');
    }

    const otp = this.otpService.generateOtp();

    await this.otpService.saveForgotPasswordOtp(dto.email, otp);
    await this.notificationFacade.sendOtp(dto.email, otp);

    return { message: 'Reset password OTP sent' };
  }

  // Alias for backward compatibility
  async forgotPassword(dto: ForgotPasswordDto) {
    return this.sendForgotPasswordOtp(dto);
  }

  // Verifies forgot-password OTP, updates password, and revokes all active sessions
  async resetPassword(dto: ResetPasswordDto) {
    const cached = await this.otpService.getForgotPasswordOtp(dto.email);

    if (!cached || cached.otp !== dto.otp) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const hashedPassword = await hashPassword(dto.newPassword);
    await this.usersService.update(user.id, { password: hashedPassword });

    await this.otpService.deleteForgotPasswordOtp(dto.email);
    await this.sessionService.clearUserSessions(user.id);

    return { message: 'Password reset successfully' };
  }

  // Changes password for authenticated user, verifies old password, and revokes sessions
  async changePassword(userId: string, dto: ChangePasswordDto) {
    const userProfile = await this.usersService.findOne(userId);
    const user = await this.usersService.findByEmail(userProfile.email);

    if (!user || !user.password) {
      throw new BadRequestException('Password not set for this account');
    }

    const isMatch = await comparePasword(dto.oldPassword, user.password);
    if (!isMatch) {
      throw new BadRequestException('Old password is incorrect');
    }

    if (dto.oldPassword === dto.newPassword) {
      throw new BadRequestException(
        'New password cannot be the same as old password',
      );
    }

    const hashedPassword = await hashPassword(dto.newPassword);
    await this.usersService.update(userId, { password: hashedPassword });

    await this.sessionService.clearUserSessions(userId);

    return { message: 'Password changed successfully' };
  }
}
