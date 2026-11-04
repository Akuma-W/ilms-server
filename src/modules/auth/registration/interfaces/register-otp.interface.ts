import { Role } from 'src/generated/prisma/enums';

export interface RegisterOtpPayload {
  email: string;
  password: string;
  fullName: string;
  role: Role;
  schoolId: string;
  identityCode?: string;
  otp: string;
}
