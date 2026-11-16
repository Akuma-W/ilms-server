import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EnrollmentStatus } from 'src/generated/prisma/enums';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';

export async function findAndValidateMember(
  prisma: PrismaService,
  classId: string,
  memberId: string,
  expectedStatus?: EnrollmentStatus,
  statusErrorMessage?: string,
) {
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      classId,
      OR: [{ id: memberId }, { userId: memberId }],
    },
    include: {
      user: true,
    },
  });

  if (!enrollment) {
    throw new NotFoundException('Enrollment not found');
  }

  if (expectedStatus && enrollment.status !== expectedStatus) {
    throw new BadRequestException(
      statusErrorMessage ||
        `Member is not in expected status: ${expectedStatus}`,
    );
  }

  return enrollment;
}

export async function getHeadTeacherId(
  prisma: PrismaService,
  classId: string,
): Promise<string> {
  const cls = await prisma.class.findUnique({
    where: { id: classId },
    select: { teacherId: true },
  });

  if (!cls) {
    throw new NotFoundException('Class not found');
  }

  return cls.teacherId;
}

export async function ensureStudentCapacity(
  prisma: PrismaService,
  classId: string,
): Promise<void> {
  const cls = await prisma.class.findUnique({
    where: { id: classId },
    select: { totalStudents: true, maxStudents: true },
  });

  if (cls?.maxStudents && cls.totalStudents >= cls.maxStudents) {
    throw new BadRequestException(
      'This class has reached its maximum student capacity',
    );
  }
}
