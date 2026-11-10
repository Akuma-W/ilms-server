import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { EnrollmentStatus, Role } from 'src/generated/prisma/enums';

@Injectable()
export class ClassMembersService {
  constructor(private readonly prisma: PrismaService) {}

  // Retrieve all members of a class including instructors, assistants and students
  async getMembers(currentUserId: string, classId: string) {
    const targetClass = await this.prisma.class.findUnique({
      where: { id: classId },
      include: {
        teacher: true,
      },
    });

    if (!targetClass) {
      throw new NotFoundException('Class not found');
    }

    const enrollments = await this.prisma.enrollment.findMany({
      where: { classId },
      include: {
        user: true,
      },
      orderBy: [{ roleIn: 'asc' }, { joinedAt: 'asc' }],
    });

    const members = enrollments.map((e) => ({
      id: e.id,
      userId: e.userId,
      user: {
        id: e.user.id,
        fullName: e.user.fullName,
        email: e.user.email,
        avatarUrl: e.user.avatarUrl,
        identityCode: e.user.identityCode,
        role: e.user.role,
      },
      role: e.roleIn,
      status: e.status,
      joinedAt: e.joinedAt ?? new Date(),
      studentCode: e.user.identityCode ?? undefined,
    }));

    const hasHeadTeacher = members.some(
      (m) => m.userId === targetClass.teacherId && m.role === Role.teacher,
    );

    if (!hasHeadTeacher && targetClass.teacher) {
      members.unshift({
        id: `owner-${targetClass.id}`,
        userId: targetClass.teacher.id,
        user: {
          id: targetClass.teacher.id,
          fullName: targetClass.teacher.fullName,
          email: targetClass.teacher.email,
          avatarUrl: targetClass.teacher.avatarUrl,
          identityCode: targetClass.teacher.identityCode,
          role: targetClass.teacher.role,
        },
        role: Role.teacher,
        status: EnrollmentStatus.approved,
        joinedAt: targetClass.createdAt ?? new Date(),
        studentCode: targetClass.teacher.identityCode ?? undefined,
      });
    }

    return members;
  }

  // Approve a pending student enrollment request
  async approveMember(
    currentUserId: string,
    classId: string,
    memberId: string,
  ) {
    await this.checkTeacherPermission(currentUserId, classId);
    const enrollment = await this.resolveEnrollment(classId, memberId);

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    if (enrollment.status !== EnrollmentStatus.pending) {
      throw new BadRequestException('Enrollment is not pending approval');
    }

    const updated = await this.prisma.enrollment.update({
      where: { id: enrollment.id },
      data: {
        status: EnrollmentStatus.approved,
        joinedAt: new Date(),
      },
    });

    return {
      message: 'Approve enrollment successful',
      data: updated,
    };
  }

  // Reject a pending student enrollment request
  async rejectMember(currentUserId: string, classId: string, memberId: string) {
    await this.checkTeacherPermission(currentUserId, classId);
    const enrollment = await this.resolveEnrollment(classId, memberId);

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    if (enrollment.status !== EnrollmentStatus.pending) {
      throw new BadRequestException('Enrollment is not pending approval');
    }

    const updated = await this.prisma.enrollment.update({
      where: { id: enrollment.id },
      data: {
        status: EnrollmentStatus.rejected,
      },
    });

    return {
      message: 'Reject enrollment successful',
      data: updated,
    };
  }

  // Remove an enrolled student or assistant from the class
  async removeMember(currentUserId: string, classId: string, memberId: string) {
    const targetClass = await this.checkTeacherPermission(
      currentUserId,
      classId,
    );
    const enrollment = await this.resolveEnrollment(classId, memberId);

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    if (enrollment.userId === targetClass.teacherId) {
      throw new ForbiddenException('Cannot remove the class head teacher');
    }

    if (
      enrollment.roleIn === Role.teacher &&
      targetClass.teacherId !== currentUserId
    ) {
      throw new ForbiddenException('Only class owner can remove co-teachers');
    }

    await this.prisma.enrollment.delete({
      where: { id: enrollment.id },
    });

    return { message: 'Remove member successful' };
  }

  // Update a member role between teaching assistant and student
  async updateMemberRole(
    currentUserId: string,
    classId: string,
    memberId: string,
    role: Role,
  ) {
    const targetClass = await this.checkTeacherPermission(
      currentUserId,
      classId,
    );
    const enrollment = await this.resolveEnrollment(classId, memberId);

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    if (enrollment.userId === targetClass.teacherId && role !== Role.teacher) {
      throw new BadRequestException('Cannot change role of class head teacher');
    }

    const updated = await this.prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { roleIn: role },
    });

    return {
      message: 'Update member role successful',
      data: updated,
    };
  }

  // Resolve enrollment record by either enrollment ID or user ID
  private async resolveEnrollment(classId: string, memberId: string) {
    return this.prisma.enrollment.findFirst({
      where: {
        classId,
        OR: [{ id: memberId }, { userId: memberId }],
      },
      include: {
        user: true,
      },
    });
  }

  // Verify that the acting user has teacher or owner privileges for this class
  private async checkTeacherPermission(userId: string, classId: string) {
    const targetClass = await this.prisma.class.findUnique({
      where: { id: classId },
    });

    if (!targetClass) {
      throw new NotFoundException('Class not found');
    }

    if (targetClass.teacherId === userId) {
      return targetClass;
    }

    const teacherEnrollment = await this.prisma.enrollment.findFirst({
      where: {
        classId,
        userId,
        roleIn: Role.teacher,
        status: EnrollmentStatus.approved,
      },
    });

    if (!teacherEnrollment) {
      throw new ForbiddenException(
        'You are not an authorized teacher of this class',
      );
    }

    return targetClass;
  }
}
