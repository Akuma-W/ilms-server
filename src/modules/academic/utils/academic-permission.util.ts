import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { EnrollmentStatus, Role } from 'src/generated/prisma/enums';

// Verifies that the acting user has teacher or admin privileges for a specified class
export async function checkTeacherPermission(
  prisma: PrismaService,
  userId: string,
  classId: string,
  userRole?: string,
  customForbiddenMessage = 'You are not authorized to perform this action for this class',
): Promise<{ id: string; teacherId: string }> {
  const targetClass = await prisma.class.findUnique({
    where: { id: classId },
    select: { id: true, teacherId: true },
  });

  if (!targetClass) {
    throw new NotFoundException('Class not found');
  }

  if (userRole === Role.admin) {
    return targetClass;
  }

  if (targetClass.teacherId === userId) {
    return targetClass;
  }

  const teacherEnrollment = await prisma.enrollment.findFirst({
    where: {
      classId,
      userId,
      roleIn: Role.teacher,
      status: EnrollmentStatus.approved,
    },
    select: { id: true },
  });

  if (!teacherEnrollment) {
    throw new ForbiddenException(customForbiddenMessage);
  }

  return targetClass;
}

// Verifies that the user is an active member or owner of the classroom
export async function checkClassMembership(
  prisma: PrismaService,
  userId: string,
  classId: string,
  userRole?: string,
): Promise<void> {
  if (userRole === Role.admin) {
    return;
  }

  const targetClass = await prisma.class.findUnique({
    where: { id: classId },
    select: { id: true, teacherId: true },
  });

  if (!targetClass) {
    throw new NotFoundException('Class not found');
  }

  if (targetClass.teacherId === userId) {
    return;
  }

  const membership = await prisma.enrollment.findFirst({
    where: {
      classId,
      userId,
      status: EnrollmentStatus.approved,
    },
    select: { id: true },
  });

  if (!membership) {
    throw new ForbiddenException(
      'You are not an authorized member of this class',
    );
  }
}
