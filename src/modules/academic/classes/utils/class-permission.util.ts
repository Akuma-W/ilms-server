import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Role } from 'src/generated/prisma/enums';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { AuthUser } from 'src/modules/auth/session/interfaces/auth-user.interface';

// Verifies that the target class exists and user is owner or administrator
export async function findClassWithPermission(
  prisma: PrismaService,
  user: AuthUser,
  classId: string,
  action: string,
) {
  const existing = await prisma.class.findUnique({
    where: { id: classId },
  });

  if (!existing) {
    throw new NotFoundException('Class not found');
  }

  if (user.role !== Role.admin && existing.teacherId !== user.id) {
    throw new ForbiddenException(`You are not allowed to ${action} this class`);
  }

  return existing;
}
