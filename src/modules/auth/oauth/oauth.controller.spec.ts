import { Test, TestingModule } from '@nestjs/testing';
import { OauthController } from './oauth.controller';
import { OauthService } from './oauth.service';
import { ConfigService } from '@nestjs/config';
import { Role } from 'src/generated/prisma/enums';
import { Response, Request } from 'express';
import { UnauthorizedException } from '@nestjs/common';

describe('OauthController', () => {
  let controller: OauthController;
  let oauthService: {
    googleLogin: jest.Mock;
    getGoogleUser: jest.Mock;
    registerGoogleUser: jest.Mock;
  };
  let configService: {
    get: jest.Mock;
  };

  const mockResponse = () => {
    return {
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
      redirect: jest.fn().mockReturnThis(),
    };
  };

  beforeEach(async () => {
    oauthService = {
      googleLogin: jest.fn(),
      getGoogleUser: jest.fn(),
      registerGoogleUser: jest.fn(),
    };
    configService = {
      get: jest.fn().mockReturnValue('http://localhost:3000'),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OauthController],
      providers: [
        { provide: OauthService, useValue: oauthService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    controller = module.get<OauthController>(OauthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('googleAuthRedirect', () => {
    it('should redirect to register if onboarding required', async () => {
      const res = mockResponse();
      oauthService.googleLogin.mockResolvedValueOnce({
        action: 'REGISTER_REQUIRED',
        data: {
          email: 'test@example.com',
          fullName: 'Test User',
          tempToken: 'temp-jwt',
        },
      });

      await controller.googleAuthRedirect(
        {
          googleId: 'g-1',
          email: 'test@example.com',
          accessToken: 'token',
        },
        res as unknown as Response,
      );

      expect(res.cookie).toHaveBeenCalledWith(
        'temp_token',
        'temp-jwt',
        expect.any(Object),
      );
      expect(res.redirect).toHaveBeenCalledWith(
        'http://localhost:3000/google/register',
      );
    });

    it('should redirect to callback on successful login', async () => {
      const res = mockResponse();
      oauthService.googleLogin.mockResolvedValueOnce({
        action: 'LOGIN',
        data: {
          userId: 'user-1',
          accessToken: 'acc',
          refreshToken: 'ref',
        },
      });

      await controller.googleAuthRedirect(
        {
          googleId: 'g-1',
          email: 'test@example.com',
          accessToken: 'token',
        },
        res as unknown as Response,
      );

      expect(res.cookie).toHaveBeenCalledTimes(2);
      expect(res.redirect).toHaveBeenCalledWith(
        'http://localhost:3000/google/callback',
      );
    });

    it('should redirect to login with error param if authentication fails', async () => {
      const res = mockResponse();
      oauthService.googleLogin.mockRejectedValueOnce(
        new UnauthorizedException('User is locked'),
      );

      await controller.googleAuthRedirect(
        {
          googleId: 'g-1',
          email: 'test@example.com',
          accessToken: 'token',
        },
        res as unknown as Response,
      );

      expect(res.redirect).toHaveBeenCalledWith(
        'http://localhost:3000/login?error=User%20is%20locked',
      );
    });
  });

  describe('getGoogleTempUser', () => {
    it('should return Google temp user details', async () => {
      const req = {
        cookies: { temp_token: 'temp-jwt' },
      } as unknown as Request;
      oauthService.getGoogleUser.mockResolvedValueOnce({
        email: 'test@example.com',
        fullName: 'Test User',
      });

      const result = await controller.getGoogleTempUser(req);

      expect(result).toEqual({
        message: 'Get google temp user',
        data: { email: 'test@example.com', fullName: 'Test User' },
      });
    });
  });

  describe('registerGoogle', () => {
    it('should throw UnauthorizedException if temp token is missing', async () => {
      const req = { cookies: {} } as unknown as Request;
      const res = mockResponse();
      const dto = { role: Role.student, schoolId: 'school-id' };

      await expect(
        controller.registerGoogle(req, res as unknown as Response, dto),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should register Google user, set cookies and clear temp token', async () => {
      const req = {
        cookies: { temp_token: 'temp-jwt' },
      } as unknown as Request;
      const res = mockResponse();
      const dto = { role: Role.student, schoolId: 'school-id' };
      oauthService.registerGoogleUser.mockResolvedValueOnce({
        userId: 'created-id',
        accessToken: 'acc',
        refreshToken: 'ref',
      });

      const result = await controller.registerGoogle(
        req,
        res as unknown as Response,
        dto,
      );

      expect(result).toEqual({
        message: 'Register successful',
        data: { userId: 'created-id', accessToken: 'acc' },
      });
      expect(res.cookie).toHaveBeenCalledTimes(2);
      expect(res.clearCookie).toHaveBeenCalledWith(
        'temp_token',
        expect.any(Object),
      );
    });
  });
});
