import { Test, TestingModule } from '@nestjs/testing';
import { CredentialsService } from './credentials.service';
import { UsersService } from 'src/modules/users/users.service';
import { TokenService } from '../session/token.service';
import { OtpService } from '../otp/otp.service';
import { NotificationFacade } from 'src/infrastructures/notification/notification.facade';
import { SessionService } from '../session/session.service';
import { Role, UserStatus } from 'src/generated/prisma/enums';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as hashUtil from 'src/common/utils/hash.util';

describe('CredentialsService', () => {
  let service: CredentialsService;
  let usersService: {
    findByEmail: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
  };
  let tokenService: {
    generateTokens: jest.Mock;
  };
  let otpService: {
    generateOtp: jest.Mock;
    saveForgotPasswordOtp: jest.Mock;
    getForgotPasswordOtp: jest.Mock;
    deleteForgotPasswordOtp: jest.Mock;
  };
  let notificationFacade: {
    sendOtp: jest.Mock;
  };
  let sessionService: {
    clearUserSessions: jest.Mock;
  };

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
    };
    tokenService = {
      generateTokens: jest.fn(),
    };
    otpService = {
      generateOtp: jest.fn(),
      saveForgotPasswordOtp: jest.fn(),
      getForgotPasswordOtp: jest.fn(),
      deleteForgotPasswordOtp: jest.fn(),
    };
    notificationFacade = {
      sendOtp: jest.fn(),
    };
    sessionService = {
      clearUserSessions: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CredentialsService,
        { provide: UsersService, useValue: usersService },
        { provide: TokenService, useValue: tokenService },
        { provide: OtpService, useValue: otpService },
        { provide: NotificationFacade, useValue: notificationFacade },
        { provide: SessionService, useValue: sessionService },
      ],
    }).compile();

    service = module.get<CredentialsService>(CredentialsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      usersService.findByEmail.mockResolvedValueOnce(null);

      await expect(
        service.validateUser('test@example.com', 'password'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user is locked', async () => {
      usersService.findByEmail.mockResolvedValueOnce({
        status: UserStatus.locked,
      });

      await expect(
        service.validateUser('test@example.com', 'password'),
      ).rejects.toThrow('User is locked');
    });

    it('should throw UnauthorizedException if user is banned', async () => {
      usersService.findByEmail.mockResolvedValueOnce({
        status: UserStatus.banned,
      });

      await expect(
        service.validateUser('test@example.com', 'password'),
      ).rejects.toThrow('User is banned');
    });

    it('should throw UnauthorizedException if user has no password', async () => {
      usersService.findByEmail.mockResolvedValueOnce({
        status: UserStatus.active,
        password: null,
      });

      await expect(
        service.validateUser('test@example.com', 'password'),
      ).rejects.toThrow('Password not found');
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      usersService.findByEmail.mockResolvedValueOnce({
        status: UserStatus.active,
        password: 'hashed-password',
      });
      jest.spyOn(hashUtil, 'comparePasword').mockResolvedValueOnce(false);

      await expect(
        service.validateUser('test@example.com', 'wrong-pass'),
      ).rejects.toThrow('Invalid credentials');
    });

    it('should return user if credentials are valid', async () => {
      const user = {
        id: 'user-id',
        email: 'test@example.com',
        status: UserStatus.active,
        password: 'hashed-password',
        role: Role.student,
      };
      usersService.findByEmail.mockResolvedValueOnce(user);
      jest.spyOn(hashUtil, 'comparePasword').mockResolvedValueOnce(true);

      const result = await service.validateUser(
        'test@example.com',
        'correct-pass',
      );

      expect(result).toEqual(user);
    });
  });

  describe('login', () => {
    it('should generate tokens and return auth response', async () => {
      const authUser = {
        id: 'user-id',
        role: Role.student,
        jti: 'jti-id',
        exp: 1700000000,
      };
      tokenService.generateTokens.mockResolvedValueOnce({
        accessToken: 'access',
        refreshToken: 'refresh',
      });

      const result = await service.login(authUser);

      expect(result).toEqual({
        userId: 'user-id',
        accessToken: 'access',
        refreshToken: 'refresh',
      });
      expect(tokenService.generateTokens).toHaveBeenCalledWith(
        'user-id',
        Role.student,
      );
    });
  });

  describe('sendForgotPasswordOtp', () => {
    it('should throw NotFoundException if email does not exist', async () => {
      usersService.findByEmail.mockResolvedValueOnce(null);

      await expect(
        service.sendForgotPasswordOtp({ email: 'notfound@example.com' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should save OTP to redis and send email when user exists', async () => {
      usersService.findByEmail.mockResolvedValueOnce({ id: 'user-id' });
      otpService.generateOtp.mockReturnValueOnce('123456');

      const result = await service.sendForgotPasswordOtp({
        email: 'test@example.com',
      });

      expect(result).toEqual({ message: 'Reset password OTP sent' });
      expect(otpService.saveForgotPasswordOtp).toHaveBeenCalledWith(
        'test@example.com',
        '123456',
      );
      expect(notificationFacade.sendOtp).toHaveBeenCalledWith(
        'test@example.com',
        '123456',
      );
    });
  });

  describe('resetPassword', () => {
    it('should throw BadRequestException if OTP not found or expired', async () => {
      otpService.getForgotPasswordOtp.mockResolvedValueOnce(null);

      await expect(
        service.resetPassword({
          email: 'test@example.com',
          otp: '123456',
          newPassword: 'Password@123',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if OTP mismatch', async () => {
      otpService.getForgotPasswordOtp.mockResolvedValueOnce({
        email: 'test@example.com',
        otp: '123456',
      });

      await expect(
        service.resetPassword({
          email: 'test@example.com',
          otp: '654321',
          newPassword: 'Password@123',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if user not found in DB', async () => {
      otpService.getForgotPasswordOtp.mockResolvedValueOnce({
        email: 'test@example.com',
        otp: '123456',
      });
      usersService.findByEmail.mockResolvedValueOnce(null);

      await expect(
        service.resetPassword({
          email: 'test@example.com',
          otp: '123456',
          newPassword: 'Password@123',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update password and invalidate sessions when OTP valid', async () => {
      otpService.getForgotPasswordOtp.mockResolvedValueOnce({
        email: 'test@example.com',
        otp: '123456',
      });
      usersService.findByEmail.mockResolvedValueOnce({
        id: 'user-id',
        email: 'test@example.com',
      });
      jest
        .spyOn(hashUtil, 'hashPassword')
        .mockResolvedValueOnce('hashed-new-password');

      const result = await service.resetPassword({
        email: 'test@example.com',
        otp: '123456',
        newPassword: 'Password@123',
      });

      expect(result).toEqual({ message: 'Password reset successfully' });
      expect(usersService.update).toHaveBeenCalledWith('user-id', {
        password: 'hashed-new-password',
      });
      expect(otpService.deleteForgotPasswordOtp).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(sessionService.clearUserSessions).toHaveBeenCalledWith('user-id');
    });
  });

  describe('changePassword', () => {
    it('should throw BadRequestException if user password not found', async () => {
      usersService.findOne.mockResolvedValueOnce({
        id: 'user-id',
        email: 'test@example.com',
      });
      usersService.findByEmail.mockResolvedValueOnce({
        id: 'user-id',
        password: null,
      });

      await expect(
        service.changePassword('user-id', {
          oldPassword: 'Old@123',
          newPassword: 'New@123',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if old password does not match', async () => {
      usersService.findOne.mockResolvedValueOnce({
        id: 'user-id',
        email: 'test@example.com',
      });
      usersService.findByEmail.mockResolvedValueOnce({
        id: 'user-id',
        password: 'stored-hash',
      });
      jest.spyOn(hashUtil, 'comparePasword').mockResolvedValueOnce(false);

      await expect(
        service.changePassword('user-id', {
          oldPassword: 'WrongOld@123',
          newPassword: 'New@123',
        }),
      ).rejects.toThrow('Old password is incorrect');
    });

    it('should throw BadRequestException if new password equals old password', async () => {
      usersService.findOne.mockResolvedValueOnce({
        id: 'user-id',
        email: 'test@example.com',
      });
      usersService.findByEmail.mockResolvedValueOnce({
        id: 'user-id',
        password: 'stored-hash',
      });
      jest.spyOn(hashUtil, 'comparePasword').mockResolvedValueOnce(true);

      await expect(
        service.changePassword('user-id', {
          oldPassword: 'SamePassword@123',
          newPassword: 'SamePassword@123',
        }),
      ).rejects.toThrow('New password cannot be the same as old password');
    });

    it('should update password and invalidate sessions when valid', async () => {
      usersService.findOne.mockResolvedValueOnce({
        id: 'user-id',
        email: 'test@example.com',
      });
      usersService.findByEmail.mockResolvedValueOnce({
        id: 'user-id',
        password: 'stored-hash',
      });
      jest.spyOn(hashUtil, 'comparePasword').mockResolvedValueOnce(true);
      jest
        .spyOn(hashUtil, 'hashPassword')
        .mockResolvedValueOnce('hashed-new-pass');

      const result = await service.changePassword('user-id', {
        oldPassword: 'OldPassword@123',
        newPassword: 'NewPassword@123',
      });

      expect(result).toEqual({ message: 'Password changed successfully' });
      expect(usersService.update).toHaveBeenCalledWith('user-id', {
        password: 'hashed-new-pass',
      });
      expect(sessionService.clearUserSessions).toHaveBeenCalledWith('user-id');
    });
  });
});
