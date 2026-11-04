import { Response } from 'express';
import { ConfigService } from '@nestjs/config';

export const COOKIE_KEYS = {
  ACCESS: 'access_token',
  REFRESH: 'refresh_token',
  TEMP: 'temp_token',
} as const;

// Returns standardized secure cookie options
export function getCookieOptions(config: ConfigService) {
  return {
    httpOnly: true,
    secure: config.get('NODE_ENV') === 'production',
    sameSite: 'lax' as const,
    path: '/',
  };
}

// Sets access and refresh tokens to HttpOnly cookies
export function setAuthCookies(
  res: Response,
  config: ConfigService,
  accessToken: string,
  refreshToken: string,
): void {
  const options = getCookieOptions(config);

  res.cookie(COOKIE_KEYS.REFRESH, refreshToken, {
    ...options,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.cookie(COOKIE_KEYS.ACCESS, accessToken, {
    ...options,
    maxAge: 15 * 60 * 1000, // 15 minutes
  });
}

// Clears authentication cookies
export function clearAuthCookies(res: Response, config: ConfigService) {
  const options = getCookieOptions(config);
  res.clearCookie(COOKIE_KEYS.REFRESH, options);
  res.clearCookie(COOKIE_KEYS.ACCESS, options);
}

// Sets temporary onboarding token to HttpOnly cookie
export function setTempCookie(
  res: Response,
  config: ConfigService,
  tempToken: string,
): void {
  const options = getCookieOptions(config);

  res.cookie(COOKIE_KEYS.TEMP, tempToken, {
    ...options,
    maxAge: 15 * 60 * 1000, // 15 minutes
  });
}

// Clears temporary onboarding cookie
export function clearTempCookie(res: Response, config: ConfigService): void {
  const options = getCookieOptions(config);
  res.clearCookie(COOKIE_KEYS.TEMP, options);
}
