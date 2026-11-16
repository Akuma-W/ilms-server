import { EnrollmentStatus, Role } from 'src/generated/prisma/enums';
import { ClassMemberEntity } from '../entities/class-member.entity';

interface RawMemberUser {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
  role: Role;
}

export function buildClassMemberEntity(
  id: string,
  user: RawMemberUser,
  avatarUrl: string | null,
  role: Role,
  status: EnrollmentStatus,
  joinedAt?: Date | string | null,
): ClassMemberEntity {
  return {
    id,
    userId: user.id,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      avatarUrl,
      identityCode: null,
      role: user.role,
    },
    role,
    status,
    joinedAt: joinedAt ?? null,
  };
}
