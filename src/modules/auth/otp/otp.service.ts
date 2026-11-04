import { Injectable } from '@nestjs/common';
import { randomInt } from 'crypto';
import { RedisService } from 'src/infrastructures/redis/redis.service';
import { OTP_CONSTANTS } from './constants/otp.constant';

// Shared service managing OTP generation, lifecycle, and Redis key storage
@Injectable()
export class OtpService {
  constructor(private readonly redis: RedisService) {}

  // Generates a 6-digit random OTP code using secure CSPRNG
  generateOtp(): string {
    return randomInt(100000, 1000000).toString();
  }

  // Generic: Saves arbitrary payload to Redis with TTL
  async saveOtp(
    key: string,
    payload: unknown,
    ttl = OTP_CONSTANTS.DEFAULT_TTL,
  ): Promise<void> {
    await this.redis.set(key, payload, ttl);
  }

  // Generic: Retrieves OTP payload from Redis
  async getOtp<T>(key: string): Promise<T | null> {
    return this.redis.get<T>(key);
  }

  // Generic: Deletes OTP key from Redis
  async deleteOtp(key: string): Promise<void> {
    await this.redis.del(key);
  }

  // Dedicated: Saves registration OTP and form payload to Redis
  async saveRegistrationOtp(
    email: string,
    payload: unknown,
    ttl = OTP_CONSTANTS.DEFAULT_TTL,
  ): Promise<void> {
    const key = `${OTP_CONSTANTS.REGISTER_PREFIX}${email}`;
    await this.saveOtp(key, payload, ttl);
  }

  // Dedicated: Retrieves registration OTP payload for an email
  async getRegistrationOtp<T>(email: string): Promise<T | null> {
    const key = `${OTP_CONSTANTS.REGISTER_PREFIX}${email}`;
    return this.getOtp<T>(key);
  }

  // Dedicated: Removes registration OTP payload after verification
  async deleteRegistrationOtp(email: string): Promise<void> {
    const key = `${OTP_CONSTANTS.REGISTER_PREFIX}${email}`;
    await this.deleteOtp(key);
  }

  // Dedicated: Saves forgot-password OTP code to Redis
  async saveForgotPasswordOtp(
    email: string,
    otp: string,
    ttl = OTP_CONSTANTS.DEFAULT_TTL,
  ): Promise<void> {
    const key = `${OTP_CONSTANTS.FORGOT_PASSWORD_PREFIX}${email}`;
    await this.saveOtp(key, { email, otp }, ttl);
  }

  // Dedicated: Retrieves forgot-password OTP for an email
  async getForgotPasswordOtp(
    email: string,
  ): Promise<{ email: string; otp: string } | null> {
    const key = `${OTP_CONSTANTS.FORGOT_PASSWORD_PREFIX}${email}`;
    return this.getOtp<{ email: string; otp: string }>(key);
  }

  // Dedicated: Removes forgot-password OTP code after reset
  async deleteForgotPasswordOtp(email: string): Promise<void> {
    const key = `${OTP_CONSTANTS.FORGOT_PASSWORD_PREFIX}${email}`;
    await this.deleteOtp(key);
  }
}
