import { Role } from 'src/generated/prisma/enums';

export interface AuthUser {
  id: string;
  accessToken: string;
  role: Role;
  exp: number;
}
