import { Test, TestingModule } from '@nestjs/testing';
import { CredentialsController } from './credentials.controller';
import { CredentialsService } from './credentials.service';
import { ConfigService } from '@nestjs/config';
import { Role } from 'src/generated/prisma/enums';
import { Response } from 'express';

describe('CredentialsController', () => {
  let controller: CredentialsController;
  let credentialsService: {
    login: jest.Mock;
    sendForgotPasswordOtp: jest.Mock;
    resetPassword: jest.Mock;
    changePassword: jest.Mock;
  };
  let configService: {
    get: jest.Mock;
  };

  const mockResponse = () => {
    return {
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
    };
  };

  beforeEach(async () => {
    credentialsService = {
      login: jest.fn(),
      sendForgotPasswordOtp: jest.fn(),
      resetPassword: jest.fn(),
      changePassword: jest.fn(),
    };
    configService = {
      get: jest.fn().mockReturnValue('production'),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CredentialsController],
      providers: [
        { provide: CredentialsService, useValue: credentialsService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    controller = module.get<CredentialsController>(CredentialsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should authenticate user and set auth cookies', async () => {
      const authUser = {
        id: 'user-1',
        role: Role.student,
        jti: 'jti-1',
        exp: 1700000000,
      };
      const res = mockResponse();
      credentialsService.login.mockResolvedValueOnce({
        userId: 'user-1',
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });

      const result = await controller.login(
        authUser,
        res as unknown as Response,
      );

      expect(result).toEqual({
        message: 'Login successful',
        data: {
          userId: 'user-1',
          accessToken: 'access-token',
        },
      });
      expect(res.cookie).toHaveBeenCalledTimes(2);
    });
  });

  describe('forgotPassword', () => {
    it('should delegate to credentialsService.sendForgotPasswordOtp', async () => {
      const dto = { email: 'test@example.com' };
      credentialsService.sendForgotPasswordOtp.mockResolvedValueOnce({
        message: 'Reset password OTP sent',
      });

      const result = await controller.forgotPassword(dto);

      expect(result).toEqual({
        message: 'Reset password OTP sent',
        data: null,
      });
      expect(credentialsService.sendForgotPasswordOtp).toHaveBeenCalledWith(
        dto,
      );
    });
  });

  describe('resetPassword', () => {
    it('should delegate to credentialsService.resetPassword', async () => {
      const dto = {
        email: 'test@example.com',
        otp: '123456',
        newPassword: 'Password@123',
      };
      credentialsService.resetPassword.mockResolvedValueOnce({
        message: 'Password reset successfully',
      });

      const result = await controller.resetPassword(dto);

      expect(result).toEqual({
        message: 'Password reset successfully',
        data: null,
      });
      expect(credentialsService.resetPassword).toHaveBeenCalledWith(dto);
    });
  });

  describe('changePassword', () => {
    it('should delegate to credentialsService.changePassword', async () => {
      const authUser = {
        id: 'user-1',
        role: Role.student,
        jti: 'jti-1',
        exp: 1700000000,
      };
      const dto = {
        oldPassword: 'OldPassword@123',
        newPassword: 'NewPassword@123',
      };
      credentialsService.changePassword.mockResolvedValueOnce({
        message: 'Password changed successfully',
      });

      const result = await controller.changePassword(authUser, dto);

      expect(result).toEqual({
        message: 'Password changed successfully',
        data: null,
      });
      expect(credentialsService.changePassword).toHaveBeenCalledWith(
        'user-1',
        dto,
      );
    });
  });
});
