import * as crypto from 'crypto';

// Generates an unpredictable high-entropy password meeting complexity requirements
export function generateSecurePassword(length: number = 12): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const specials = '!@#$%^&*()_+~|}{[]:;?><,./-=';

  const allChars = uppercase + lowercase + digits + specials;

  const requiredChars = [
    uppercase[crypto.randomInt(uppercase.length)],
    lowercase[crypto.randomInt(lowercase.length)],
    digits[crypto.randomInt(digits.length)],
    specials[crypto.randomInt(specials.length)],
  ];

  const remainingLength = Math.max(0, length - requiredChars.length);
  const remainingChars = Array.from(
    { length: remainingLength },
    () => allChars[crypto.randomInt(allChars.length)],
  );

  const combined = [...requiredChars, ...remainingChars];

  for (let i = combined.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [combined[i], combined[j]] = [combined[j], combined[i]];
  }

  return combined.join('');
}
