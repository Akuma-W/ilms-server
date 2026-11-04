import { Test, TestingModule } from '@nestjs/testing';
import { OauthService } from './oauth.service';
import { UsersService } from 'src/modules/users/users.service';
import { TokenService } from '../session/token.service';
import { Role, UserStatus } from 'src/generated/prisma/enums';
import { GoogleProfile } from './interfaces/google-profile.interface';
import {
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';

describe('OauthService', () => {
  let service: OauthService;
  let usersService: {
    findByEmail: jest.Mock;
    update: jest.Mock;
    create: jest.Mock;
  };
  let tokenService: {
    generateTokens: jest.Mock;
    generateTempToken: jest.Mock;
    verifyTempToken: jest.Mock;
  };

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    };
    tokenService = {
      generateTokens: jest.fn(),
      generateTempToken: jest.fn(),
      verifyTempToken: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OauthService,
        { provide: UsersService, useValue: usersService },
        { provide: TokenService, useValue: tokenService },
      ],
    }).compile();

    service = module.get<OauthService>(OauthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('googleLogin', () => {
    const profile: GoogleProfile = {
      googleId: 'g-123',
      email: 'test@example.com',
      firstName: 'A',
      lastName: 'Nguyen',
      avatar: 'avatar.png',
      accessToken: 'token',
    };

    it('should throw UnauthorizedException if user is locked', async () => {
      usersService.findByEmail.mockResolvedValueOnce({
        id: 'user-id',
        status: UserStatus.locked,
      });

      await expect(service.googleLogin(profile)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if user is banned', async () => {
      usersService.findByEmail.mockResolvedValueOnce({
        id: 'user-id',
        status: UserStatus.banned,
      });

      await expect(service.googleLogin(profile)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should return LOGIN action when user exists and profile is complete', async () => {
      usersService.findByEmail.mockResolvedValueOnce({
        id: 'user-id',
        googleId: 'g-123',
        status: UserStatus.active,
        role: Role.student,
        schoolId: 'school-id',
        identityCode: 'SV123',
      });
      tokenService.generateTokens.mockResolvedValueOnce({
        accessToken: 'access',
        refreshToken: 'refresh',
      });

      const result = await service.googleLogin(profile);

      expect(result).toEqual({
        action: 'LOGIN',
        data: {
          userId: 'user-id',
          accessToken: 'access',
          refreshToken: 'refresh',
        },
      });
    });

    it('should link googleId and sync avatar on login', async () => {
      usersService.findByEmail.mockResolvedValueOnce({
        id: 'user-id',
        googleId: null,
        status: UserStatus.active,
        avatarUrl: null,
        role: Role.teacher,
        schoolId: 'school-id',
      });
      tokenService.generateTokens.mockResolvedValueOnce({
        accessToken: 'access',
        refreshToken: 'refresh',
      });

      await service.googleLogin(profile);

      expect(usersService.update).toHaveBeenCalledWith('user-id', {
        googleId: 'g-123',
        avatarUrl: 'avatar.png',
      });
    });

    it('should return REGISTER_REQUIRED action when user does not exist', async () => {
      usersService.findByEmail.mockResolvedValueOnce(null);
      tokenService.generateTempToken.mockReturnValueOnce('temp-jwt');

      const result = await service.googleLogin(profile);

      expect(result).toEqual({
        action: 'REGISTER_REQUIRED',
        data: {
          email: profile.email,
          fullName: 'Nguyen A',
          avatar: profile.avatar,
          tempToken: 'temp-jwt',
        },
      });
    });
  });

  describe('getGoogleUser', () => {
    it('should return payload from temp token', async () => {
      tokenService.verifyTempToken.mockResolvedValueOnce({
        email: 'test@example.com',
        fullName: 'Nguyen A',
        avatar: 'avatar.png',
      });

      const result = await service.getGoogleUser('temp-token');

      expect(result).toEqual({
        email: 'test@example.com',
        fullName: 'Nguyen A',
        avatar: 'avatar.png',
      });
    });
  });

  describe('registerGoogleUser', () => {
    it('should throw ForbiddenException if role is admin', async () => {
      tokenService.verifyTempToken.mockResolvedValueOnce({
        email: 'test@example.com',
        googleId: 'g-123',
        fullName: 'Nguyen A',
      });

      await expect(
        service.registerGoogleUser('token', {
          role: Role.admin,
          schoolId: 'school-id',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if student has no identityCode', async () => {
      tokenService.verifyTempToken.mockResolvedValueOnce({
        email: 'test@example.com',
        googleId: 'g-123',
        fullName: 'Nguyen A',
      });

      await expect(
        service.registerGoogleUser('token', {
          role: Role.student,
          schoolId: 'school-id',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create user and return tokens when profile valid', async () => {
      tokenService.verifyTempToken.mockResolvedValueOnce({
        email: 'test@example.com',
        googleId: 'g-123',
        fullName: 'Nguyen A',
        avatar: 'avatar.png',
      });
      usersService.findByEmail.mockResolvedValueOnce(null);
      usersService.create.mockResolvedValueOnce({
        id: 'created-id',
        role: Role.teacher,
        status: UserStatus.active,
      });
      tokenService.generateTokens.mockResolvedValueOnce({
        accessToken: 'acc',
        refreshToken: 'ref',
      });

      const result = await service.registerGoogleUser('token', {
        role: Role.teacher,
        schoolId: 'school-id',
      });

      expect(result).toEqual({
        userId: 'created-id',
        accessToken: 'acc',
        refreshToken: 'ref',
      });
    });
  });
});
