import { Role } from 'src/generated/prisma/enums';

export interface AuthUser {
  id: string;
  jti: string;
  role: Role;
  exp: number;
}
