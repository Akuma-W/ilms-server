import { BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { AuthUser } from 'src/modules/auth/session/interfaces/auth-user.interface';
import { findClassWithPermission } from './class-permission.util';

export async function executeClassArchive(
  prisma: PrismaService,
  user: AuthUser,
  classId: string,
): Promise<{ message: string }> {
  const existing = await findClassWithPermission(
    prisma,
    user,
    classId,
    'archive',
  );

  if (existing.isArchived) {
    throw new BadRequestException('Class is already archived');
  }

  await prisma.class.update({
    where: { id: classId },
    data: { isArchived: true },
  });

  return { message: 'Class archived successfully' };
}

export async function executeClassUnarchive(
  prisma: PrismaService,
  user: AuthUser,
  classId: string,
): Promise<{ message: string }> {
  const existing = await findClassWithPermission(
    prisma,
    user,
    classId,
    'unarchive',
  );

  if (!existing.isArchived) {
    throw new BadRequestException('Class is not archived');
  }

  await prisma.class.update({
    where: { id: classId },
    data: { isArchived: false },
  });

  return { message: 'Class unarchived successfully' };
}
