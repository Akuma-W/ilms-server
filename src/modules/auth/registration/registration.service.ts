import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { hashPassword } from 'src/common/utils/hash.util';
import { Role, UserStatus } from 'src/generated/prisma/enums';
import { UsersService } from 'src/modules/users/users.service';
import { NotificationFacade } from 'src/infrastructures/notification/notification.facade';
import { RegisterDto } from './dto/register.dto';
import { VerifyRegistrationOtpDto } from './dto/verify-registration-otp.dto';
import { ResendRegistrationOtpDto } from './dto/resend-registration-otp.dto';
import { OtpService } from '../otp/otp.service';
import { RegisterOtpPayload } from './interfaces/register-otp.interface';

// Service coordinating registration lifecycle, OTP dispatch, and user provisioning
@Injectable()
export class RegistrationService {
  private readonly logger = new Logger(RegistrationService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly otpService: OtpService,
    private readonly notificationFacade: NotificationFacade,
  ) {}

  // Handles initial registration, hashes password, saves payload to Redis and sends OTP
  async register(dto: RegisterDto) {
    const { email, password, role, identityCode } = dto;

    const existed = await this.usersService.findByEmail(email);
    if (existed) {
      throw new ConflictException('Email already exists');
    }

    this.validateIdentity(role, identityCode);

    const hashedPassword = await hashPassword(password);
    const otp = this.otpService.generateOtp();

    const payload: RegisterOtpPayload = {
      email,
      password: hashedPassword,
      fullName: dto.fullName,
      role,
      schoolId: dto.schoolId,
      identityCode,
      otp,
    };

    await this.otpService.saveRegistrationOtp(email, payload);
    await this.notificationFacade.sendOtp(email, otp);

    return { message: 'OTP sent successfully' };
  }

  // Verifies registration OTP and persists user account in PostgreSQL
  async verifyRegistrationOtp(dto: VerifyRegistrationOtpDto) {
    const cached = await this.otpService.getRegistrationOtp<RegisterOtpPayload>(
      dto.email,
    );

    if (!cached) {
      throw new BadRequestException('OTP expired or invalid');
    }

    if (cached.otp !== dto.otp) {
      throw new BadRequestException('Invalid OTP code');
    }

    await this.otpService.deleteRegistrationOtp(dto.email);

    const user = await this.usersService.create({
      email: cached.email,
      password: cached.password,
      fullName: cached.fullName,
      role: cached.role,
      schoolId: cached.schoolId,
      identityCode: cached.identityCode,
      status: UserStatus.active,
    });

    return {
      userId: user.id,
    };
  }

  // Resends a new OTP code for pending registration
  async resendRegistrationOtp(dto: ResendRegistrationOtpDto) {
    const cached = await this.otpService.getRegistrationOtp<RegisterOtpPayload>(
      dto.email,
    );

    if (!cached) {
      throw new BadRequestException(
        'Pending registration not found or OTP expired',
      );
    }

    const newOtp = this.otpService.generateOtp();
    const updatedPayload: RegisterOtpPayload = {
      ...cached,
      otp: newOtp,
    };

    await this.otpService.saveRegistrationOtp(dto.email, updatedPayload);
    await this.notificationFacade.sendOtp(dto.email, newOtp);

    return { message: 'Registration OTP resent successfully' };
  }

  // Validates role-specific identity code requirement
  private validateIdentity(role: Role, identityCode?: string) {
    if (role === Role.student && !identityCode) {
      throw new BadRequestException('identityCode is required for student');
    }
  }
}
