import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { EnrollmentStatus, Role } from 'src/generated/prisma/enums';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';

export async function executeAddAssistant(
  prisma: PrismaService,
  classId: string,
  assistantUserId: string,
  currentUserId: string,
  currentUserRole: Role,
): Promise<{ message: string; data: unknown }> {
  const cls = await prisma.class.findUnique({
    where: { id: classId },
    select: { id: true, teacherId: true, schoolId: true },
  });
  if (!cls) {
    throw new NotFoundException('Class not found');
  }

  if (currentUserRole !== Role.admin && currentUserId !== cls.teacherId) {
    throw new ForbiddenException(
      'Only class owner or admin can add assistant teachers',
    );
  }

  if (assistantUserId === cls.teacherId) {
    throw new BadRequestException(
      'User is already the head teacher of this class',
    );
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: assistantUserId },
    select: { id: true, schoolId: true },
  });
  if (!targetUser) {
    throw new NotFoundException('User not found');
  }
  if (targetUser.schoolId !== cls.schoolId) {
    throw new BadRequestException(
      'Assistant teacher must belong to the same school',
    );
  }

  const existing = await prisma.enrollment.findUnique({
    where: { classId_userId: { classId, userId: assistantUserId } },
  });

  if (existing) {
    if (
      existing.status === EnrollmentStatus.approved &&
      existing.roleIn === Role.teacher
    ) {
      throw new BadRequestException(
        'User is already a teacher/assistant in this class',
      );
    }
    if (
      existing.status === EnrollmentStatus.approved &&
      existing.roleIn === Role.student
    ) {
      await prisma.class.update({
        where: { id: classId },
        data: { totalStudents: { decrement: 1 } },
      });
    }
    const updated = await prisma.enrollment.update({
      where: { id: existing.id },
      data: {
        roleIn: Role.teacher,
        status: EnrollmentStatus.approved,
        joinedAt: new Date(),
      },
    });
    return {
      message: 'Assistant teacher added successfully',
      data: updated,
    };
  }

  const created = await prisma.enrollment.create({
    data: {
      classId,
      userId: assistantUserId,
      roleIn: Role.teacher,
      status: EnrollmentStatus.approved,
      joinedAt: new Date(),
    },
  });

  return {
    message: 'Assistant teacher added successfully',
    data: created,
  };
}
