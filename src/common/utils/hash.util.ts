import { ConfigService } from '@nestjs/config';
import bcrypt from 'bcrypt';

const config = new ConfigService();

export async function hashPassword(password: string) {
  const saltRounds = config.get<number>('auth.saltRounds', 10);
  return await bcrypt.hash(password, saltRounds);
}

export async function comparePasword(password: string, hashedPassword: string) {
  return await bcrypt.compare(password, hashedPassword);
}

export async function hashToken(token: string) {
  const saltRounds = config.get<number>('auth.saltRounds', 10);
  return await bcrypt.hash(token, saltRounds);
}

export async function compareToken(token: string, hashedToken: string) {
  return await bcrypt.compare(token, hashedToken);
}
