import { ConfigService } from '@nestjs/config';
import bcrypt from 'bcrypt';

const config = new ConfigService();

export async function hashPassword(password: string) {
  const saltRounds = config.get<number>('auth.saltRounds', 10);
  return await bcrypt.hash(password, saltRounds);
}

export async function comparePassword(
  password: string,
  hashedPassword: string,
) {
  return await bcrypt.compare(password, hashedPassword);
}
