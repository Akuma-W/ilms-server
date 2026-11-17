import { EnrollmentStatus, Role } from 'src/generated/prisma/enums';
import { ClassMemberEntity } from '../entities/class-member.entity';

interface RawMemberUser {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
  identityCode?: string | null;
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
  const code = user.identityCode ?? null;
  return {
    id,
    userId: user.id,
    identityCode: code,
    studentCode: code ?? undefined,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      avatarUrl,
      avatar: avatarUrl,
      identityCode: code,
      role: user.role,
    },
    role,
    status,
    joinedAt: joinedAt ?? null,
  };
}
