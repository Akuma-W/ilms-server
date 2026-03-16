import { Role } from 'src/generated/prisma/enums';

export interface JwtPayload {
  sub: string;
  jti: string;
  role: Role;
  exp: number;
}
