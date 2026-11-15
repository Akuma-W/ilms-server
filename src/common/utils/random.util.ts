import { randomInt } from 'crypto';

// Generates a cryptographically secure random alphanumeric string code
export function generateRandomCode(
  length = 6,
  charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
): string {
  let result = '';
  const charsetLength = charset.length;

  for (let i = 0; i < length; i++) {
    result += charset[randomInt(0, charsetLength)];
  }

  return result;
}

// Generates numeric one-time password of specified length
export function generateNumericOtp(length = 6): string {
  return generateRandomCode(length, '0123456789');
}
