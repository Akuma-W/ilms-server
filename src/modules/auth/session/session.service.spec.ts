import { Test, TestingModule } from '@nestjs/testing';
import { SessionService } from './session.service';
import { RedisService } from 'src/infrastructures/redis/redis.service';
import { UsersService } from 'src/modules/users/users.service';
import { TokenService } from './token.service';
import { Role } from 'src/generated/prisma/enums';
import { UnauthorizedException } from '@nestjs/common';
import * as hashUtil from 'src/common/utils/hash.util';

describe('SessionService', () => {
  let service: SessionService;
  let redisService: {
    get: jest.Mock;
    del: jest.Mock;
    getClient: jest.Mock;
  };
  let usersService: {
    findOne: jest.Mock;
  };
  let tokenService: {
    verifyRefreshToken: jest.Mock;
    generateTokens: jest.Mock;
    addBlacklist: jest.Mock;
  };
  let redisClient: {
    keys: jest.Mock;
    del: jest.Mock;
  };

  beforeEach(async () => {
    redisClient = {
      keys: jest.fn(),
      del: jest.fn(),
    };
    redisService = {
      get: jest.fn(),
      del: jest.fn(),
      getClient: jest.fn().mockReturnValue(redisClient),
    };
    usersService = {
      findOne: jest.fn(),
    };
    tokenService = {
      verifyRefreshToken: jest.fn(),
      generateTokens: jest.fn(),
      addBlacklist: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionService,
        { provide: RedisService, useValue: redisService },
        { provide: UsersService, useValue: usersService },
        { provide: TokenService, useValue: tokenService },
      ],
    }).compile();

    service = module.get<SessionService>(SessionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('refreshToken', () => {
    it('should throw UnauthorizedException if stored token is not found', async () => {
      tokenService.verifyRefreshToken.mockResolvedValueOnce({
        sub: 'user-id',
        jti: 'jti-id',
        role: Role.student,
      });
      redisService.get.mockResolvedValueOnce(null);

      await expect(service.refreshToken('refresh-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if token does not match', async () => {
      tokenService.verifyRefreshToken.mockResolvedValueOnce({
        sub: 'user-id',
        jti: 'jti-id',
        role: Role.student,
      });
      redisService.get.mockResolvedValueOnce('stored-hash');
      jest.spyOn(hashUtil, 'compareToken').mockResolvedValueOnce(false);

      await expect(service.refreshToken('refresh-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if user not found', async () => {
      tokenService.verifyRefreshToken.mockResolvedValueOnce({
        sub: 'user-id',
        jti: 'jti-id',
        role: Role.student,
      });
      redisService.get.mockResolvedValueOnce('stored-hash');
      jest.spyOn(hashUtil, 'compareToken').mockResolvedValueOnce(true);
      usersService.findOne.mockResolvedValueOnce(null);

      await expect(service.refreshToken('refresh-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should rotate token and return new tokens on valid request', async () => {
      tokenService.verifyRefreshToken.mockResolvedValueOnce({
        sub: 'user-id',
        jti: 'jti-id',
        role: Role.student,
      });
      redisService.get.mockResolvedValueOnce('stored-hash');
      jest.spyOn(hashUtil, 'compareToken').mockResolvedValueOnce(true);
      usersService.findOne.mockResolvedValueOnce({
        id: 'user-id',
        role: Role.student,
      });
      tokenService.generateTokens.mockResolvedValueOnce({
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
      });

      const result = await service.refreshToken('refresh-token');

      expect(result).toEqual({
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
      });
      expect(redisService.del).toHaveBeenCalledWith('refresh:user-id:jti-id');
    });
  });

  describe('logout', () => {
    it('should blacklist access token and delete refresh session', async () => {
      const user = {
        id: 'user-id',
        jti: 'jti-id',
        role: Role.student,
        exp: 1700000000,
      };

      await service.logout(user, 'access-token');

      expect(tokenService.addBlacklist).toHaveBeenCalledWith(
        'access-token',
        user.exp,
      );
      expect(redisService.del).toHaveBeenCalledWith('refresh:user-id:jti-id');
    });
  });

  describe('clearUserSessions', () => {
    it('should delete all matching refresh session keys for user', async () => {
      redisClient.keys.mockResolvedValueOnce([
        'refresh:user-1:jti-1',
        'refresh:user-1:jti-2',
      ]);

      await service.clearUserSessions('user-1');

      expect(redisClient.keys).toHaveBeenCalledWith('refresh:user-1:*');
      expect(redisClient.del).toHaveBeenCalledWith(
        'refresh:user-1:jti-1',
        'refresh:user-1:jti-2',
      );
    });

    it('should not call del if no matching keys found', async () => {
      redisClient.keys.mockResolvedValueOnce([]);

      await service.clearUserSessions('user-1');

      expect(redisClient.keys).toHaveBeenCalledWith('refresh:user-1:*');
      expect(redisClient.del).not.toHaveBeenCalled();
    });
  });
});
