import { Test, TestingModule } from '@nestjs/testing';
import { SessionController } from './session.controller';
import { SessionService } from './session.service';
import { ConfigService } from '@nestjs/config';
import { Response, Request } from 'express';
import { UnauthorizedException } from '@nestjs/common';

describe('SessionController', () => {
  let controller: SessionController;
  let sessionService: {
    refreshToken: jest.Mock;
    logout: jest.Mock;
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
    sessionService = {
      refreshToken: jest.fn(),
      logout: jest.fn(),
    };
    configService = {
      get: jest.fn().mockReturnValue('production'),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SessionController],
      providers: [
        { provide: SessionService, useValue: sessionService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    controller = module.get<SessionController>(SessionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('refresh', () => {
    it('should refresh tokens and update cookies', async () => {
      const req = {
        cookies: { refresh_token: 'old-ref' },
      } as unknown as Request;
      const res = mockResponse();
      sessionService.refreshToken.mockResolvedValueOnce({
        accessToken: 'new-acc',
        refreshToken: 'new-ref',
      });

      const result = await controller.refresh(req, res as unknown as Response);

      expect(result).toEqual({ message: 'Refresh successful' });
      expect(res.cookie).toHaveBeenCalledTimes(2);
    });
  });

  describe('logout', () => {
    it('should throw UnauthorizedException if auth header missing', async () => {
      const req = {
        headers: {},
        user: { id: 'user-1', jti: 'jti-1', exp: 1700000000 },
      } as unknown as Request;
      const res = mockResponse();

      await expect(
        controller.logout(req, res as unknown as Response),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should revoke session and clear auth cookies', async () => {
      const req = {
        headers: { authorization: 'Bearer test-token' },
        user: { id: 'user-1', jti: 'jti-1', exp: 1700000000 },
      } as unknown as Request;
      const res = mockResponse();

      const result = await controller.logout(req, res as unknown as Response);

      expect(result).toEqual({ message: 'Logout successful' });
      expect(sessionService.logout).toHaveBeenCalledWith(
        req.user,
        'test-token',
      );
      expect(res.clearCookie).toHaveBeenCalledTimes(2);
    });
  });
});
