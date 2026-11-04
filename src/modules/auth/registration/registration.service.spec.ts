import { Test, TestingModule } from '@nestjs/testing';
import { RegistrationService } from './registration.service';
import { UsersService } from 'src/modules/users/users.service';
import { OtpService } from '../otp/otp.service';
import { NotificationFacade } from 'src/infrastructures/notification/notification.facade';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { Role, UserStatus } from 'src/generated/prisma/enums';
import { RegisterDto } from './dto/register.dto';
import { RegisterOtpPayload } from './interfaces/register-otp.interface';

describe('RegistrationService', () => {
  let service: RegistrationService;
  let usersService: {
    findByEmail: jest.Mock;
    create: jest.Mock;
  };
  let otpService: {
    generateOtp: jest.Mock;
    saveRegistrationOtp: jest.Mock;
    getRegistrationOtp: jest.Mock;
    deleteRegistrationOtp: jest.Mock;
  };
  let notificationFacade: {
    sendOtp: jest.Mock;
  };

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
      create: jest.fn(),
    };
    otpService = {
      generateOtp: jest.fn(),
      saveRegistrationOtp: jest.fn(),
      getRegistrationOtp: jest.fn(),
      deleteRegistrationOtp: jest.fn(),
    };
    notificationFacade = {
      sendOtp: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegistrationService,
        { provide: UsersService, useValue: usersService },
        { provide: OtpService, useValue: otpService },
        { provide: NotificationFacade, useValue: notificationFacade },
      ],
    }).compile();

    service = module.get<RegistrationService>(RegistrationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'test@example.com',
      password: 'Password@123',
      fullName: 'Test User',
      role: Role.student,
      schoolId: 'school-uuid',
      identityCode: 'SV123456',
    };

    it('should throw ConflictException if email exists', async () => {
      usersService.findByEmail.mockResolvedValueOnce({ id: 'existing-id' });

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(usersService.findByEmail).toHaveBeenCalledWith(registerDto.email);
    });

    it('should throw BadRequestException if student has no identityCode', async () => {
      usersService.findByEmail.mockResolvedValueOnce(null);

      await expect(
        service.register({ ...registerDto, identityCode: undefined }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should save registration OTP and send email on valid registration', async () => {
      usersService.findByEmail.mockResolvedValueOnce(null);
      otpService.generateOtp.mockReturnValueOnce('123456');

      const result = await service.register(registerDto);

      expect(result).toEqual({ message: 'OTP sent successfully' });
      expect(otpService.saveRegistrationOtp).toHaveBeenCalledWith(
        registerDto.email,
        expect.objectContaining({
          email: registerDto.email,
          fullName: registerDto.fullName,
          otp: '123456',
        }),
      );
      expect(notificationFacade.sendOtp).toHaveBeenCalledWith(
        registerDto.email,
        '123456',
      );
    });
  });

  describe('verifyRegistrationOtp', () => {
    const cachedPayload: RegisterOtpPayload = {
      email: 'test@example.com',
      password: 'hashed-password',
      fullName: 'Test User',
      role: Role.student,
      schoolId: 'school-uuid',
      identityCode: 'SV123456',
      otp: '123456',
    };

    it('should throw BadRequestException if OTP not found or expired', async () => {
      otpService.getRegistrationOtp.mockResolvedValueOnce(null);

      await expect(
        service.verifyRegistrationOtp({
          email: 'test@example.com',
          otp: '123456',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if OTP is incorrect', async () => {
      otpService.getRegistrationOtp.mockResolvedValueOnce(cachedPayload);

      await expect(
        service.verifyRegistrationOtp({
          email: 'test@example.com',
          otp: '654321',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create user and delete OTP when code matches', async () => {
      otpService.getRegistrationOtp.mockResolvedValueOnce(cachedPayload);
      usersService.create.mockResolvedValueOnce({
        id: 'new-user-id',
        email: cachedPayload.email,
        status: UserStatus.active,
      });

      const result = await service.verifyRegistrationOtp({
        email: 'test@example.com',
        otp: '123456',
      });

      expect(result).toEqual({ userId: 'new-user-id' });
      expect(otpService.deleteRegistrationOtp).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(usersService.create).toHaveBeenCalledWith({
        email: cachedPayload.email,
        password: cachedPayload.password,
        fullName: cachedPayload.fullName,
        role: cachedPayload.role,
        schoolId: cachedPayload.schoolId,
        identityCode: cachedPayload.identityCode,
        status: UserStatus.active,
      });
    });
  });

  describe('resendRegistrationOtp', () => {
    const cachedPayload: RegisterOtpPayload = {
      email: 'test@example.com',
      password: 'hashed-password',
      fullName: 'Test User',
      role: Role.student,
      schoolId: 'school-uuid',
      identityCode: 'SV123456',
      otp: '123456',
    };

    it('should throw BadRequestException if no pending registration', async () => {
      otpService.getRegistrationOtp.mockResolvedValueOnce(null);

      await expect(
        service.resendRegistrationOtp({ email: 'test@example.com' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should generate new OTP, save and resend', async () => {
      otpService.getRegistrationOtp.mockResolvedValueOnce(cachedPayload);
      otpService.generateOtp.mockReturnValueOnce('654321');

      const result = await service.resendRegistrationOtp({
        email: 'test@example.com',
      });

      expect(result).toEqual({
        message: 'Registration OTP resent successfully',
      });
      expect(otpService.saveRegistrationOtp).toHaveBeenCalledWith(
        'test@example.com',
        expect.objectContaining({
          otp: '654321',
        }),
      );
      expect(notificationFacade.sendOtp).toHaveBeenCalledWith(
        'test@example.com',
        '654321',
      );
    });
  });
});
