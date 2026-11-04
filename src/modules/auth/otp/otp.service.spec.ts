import { Test, TestingModule } from '@nestjs/testing';
import { OtpService } from './otp.service';
import { RedisService } from 'src/infrastructures/redis/redis.service';

describe('OtpService', () => {
  let service: OtpService;
  let redisService: {
    set: jest.Mock;
    get: jest.Mock;
    del: jest.Mock;
  };

  beforeEach(async () => {
    redisService = {
      set: jest.fn(),
      get: jest.fn(),
      del: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OtpService,
        {
          provide: RedisService,
          useValue: redisService,
        },
      ],
    }).compile();

    service = module.get<OtpService>(OtpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateOtp', () => {
    it('should generate a 6-digit numeric OTP string', () => {
      const otp = service.generateOtp();
      expect(otp).toHaveLength(6);
      expect(Number(otp)).toBeGreaterThanOrEqual(100000);
      expect(Number(otp)).toBeLessThanOrEqual(999999);
    });
  });

  describe('generic methods', () => {
    it('should save, get and delete arbitrary OTP payload', async () => {
      const key = 'otp:custom';
      const payload = { val: '123' };

      await service.saveOtp(key, payload, 100);
      expect(redisService.set).toHaveBeenCalledWith(key, payload, 100);

      redisService.get.mockResolvedValueOnce(payload);
      const res = await service.getOtp(key);
      expect(res).toEqual(payload);

      await service.deleteOtp(key);
      expect(redisService.del).toHaveBeenCalledWith(key);
    });
  });

  describe('registration OTP methods', () => {
    it('should handle registration OTP lifecycle', async () => {
      const email = 'user@example.com';
      const payload = { email, otp: '123456' };

      await service.saveRegistrationOtp(email, payload);
      expect(redisService.set).toHaveBeenCalledWith(
        'otp:register:user@example.com',
        payload,
        300,
      );

      redisService.get.mockResolvedValueOnce(payload);
      const res = await service.getRegistrationOtp(email);
      expect(res).toEqual(payload);

      await service.deleteRegistrationOtp(email);
      expect(redisService.del).toHaveBeenCalledWith(
        'otp:register:user@example.com',
      );
    });
  });

  describe('forgot password OTP methods', () => {
    it('should handle forgot password OTP lifecycle', async () => {
      const email = 'user@example.com';
      const otp = '654321';

      await service.saveForgotPasswordOtp(email, otp);
      expect(redisService.set).toHaveBeenCalledWith(
        'otp:forgot:user@example.com',
        { email, otp },
        300,
      );

      redisService.get.mockResolvedValueOnce({ email, otp });
      const res = await service.getForgotPasswordOtp(email);
      expect(res).toEqual({ email, otp });

      await service.deleteForgotPasswordOtp(email);
      expect(redisService.del).toHaveBeenCalledWith(
        'otp:forgot:user@example.com',
      );
    });
  });
});
