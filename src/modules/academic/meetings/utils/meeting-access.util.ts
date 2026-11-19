import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { EnrollmentStatus, Role } from 'src/generated/prisma/enums';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';

export async function verifyClassAccess(
  prisma: PrismaService,
  classId: string,
  userId: string,
  role: Role,
): Promise<void> {
  if (role === Role.admin) return;

  const targetClass = await prisma.class.findUnique({
    where: { id: classId },
    select: { teacherId: true },
  });

  if (!targetClass) {
    throw new NotFoundException('Class not found');
  }

  if (targetClass.teacherId === userId) return;

  const enrollment = await prisma.enrollment.findUnique({
    where: {
      classId_userId: { classId, userId },
    },
    select: { status: true },
  });

  if (!enrollment || enrollment.status !== EnrollmentStatus.approved) {
    throw new ForbiddenException(
      'You are not an approved member of this class',
    );
  }
}
