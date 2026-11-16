import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { StorageService } from 'src/infrastructures/storage/storage.service';
import { EnrollmentStatus, Role } from 'src/generated/prisma/enums';
import { ClassMemberEntity } from './entities/class-member.entity';

@Injectable()
export class ClassMembersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  // Retrieve all members of a class including instructors, assistants and students
  async getMembers(classId: string): Promise<ClassMemberEntity[]> {
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
      orderBy: {
        joinedAt: 'desc',
      },
    });

    const members: ClassMemberEntity[] = [];

    const isTeacherInEnrollments = enrollments.some(
      (e) => e.userId === targetClass.teacherId,
    );

    if (!isTeacherInEnrollments && targetClass.teacher) {
      const avatarUrl = targetClass.teacher.avatarUrl
        ? await this.storage.getAvatarUrl(targetClass.teacher.avatarUrl)
        : null;

      members.push({
        id: 'owner',
        userId: targetClass.teacher.id,
        user: {
          id: targetClass.teacher.id,
          fullName: targetClass.teacher.fullName,
          email: targetClass.teacher.email,
          avatarUrl,
          identityCode: null,
          role: targetClass.teacher.role,
        },
        role: Role.teacher,
        status: EnrollmentStatus.approved,
        joinedAt: targetClass.createdAt,
      });
    }

    for (const e of enrollments) {
      const avatarUrl = e.user.avatarUrl
        ? await this.storage.getAvatarUrl(e.user.avatarUrl)
        : null;

      members.push({
        id: e.id,
        userId: e.userId,
        user: {
          id: e.user.id,
          fullName: e.user.fullName,
          email: e.user.email,
          avatarUrl,
          identityCode: null,
          role: e.user.role,
        },
        role: e.roleIn,
        status: e.status,
        joinedAt: e.joinedAt,
      });
    }

    return members;
  }

  // Approve a pending student enrollment request
  async approveMember(
    classId: string,
    memberId: string,
  ): Promise<{ message: string; data: unknown }> {
    const enrollment = await this.findAndValidateMember(
      classId,
      memberId,
      EnrollmentStatus.pending,
      'Enrollment is not pending approval',
    );

    const updated = await this.prisma.enrollment.update({
      where: { id: enrollment.id },
      data: {
        status: EnrollmentStatus.approved,
        joinedAt: new Date(),
      },
    });

    // TODO (Notification): Notify student that their enrollment has been approved
    return {
      message: 'Approve enrollment successful',
      data: updated,
    };
  }

  // Reject a pending student enrollment request
  async rejectMember(
    classId: string,
    memberId: string,
  ): Promise<{ message: string; data: unknown }> {
    const enrollment = await this.findAndValidateMember(
      classId,
      memberId,
      EnrollmentStatus.pending,
      'Enrollment is not pending approval',
    );

    const updated = await this.prisma.enrollment.update({
      where: { id: enrollment.id },
      data: {
        status: EnrollmentStatus.rejected,
      },
    });

    // TODO (Notification): Notify student that their enrollment has been rejected
    return {
      message: 'Reject enrollment successful',
      data: updated,
    };
  }

  // Re-approve a previously rejected student enrollment request
  async reApproveMember(
    classId: string,
    memberId: string,
  ): Promise<{ message: string; data: unknown }> {
    const enrollment = await this.findAndValidateMember(
      classId,
      memberId,
      EnrollmentStatus.rejected,
      'Enrollment is not currently rejected',
    );

    const updated = await this.prisma.enrollment.update({
      where: { id: enrollment.id },
      data: {
        status: EnrollmentStatus.approved,
        joinedAt: new Date(),
      },
    });

    // TODO (Notification): Notify student that enrollment was re-approved by teacher
    return {
      message: 'Member re-approved successfully',
      data: updated,
    };
  }

  // Suspend / ban a member from the classroom
  async banMember(
    classId: string,
    memberId: string,
  ): Promise<{ message: string; data: unknown }> {
    const headTeacherId = await this.getHeadTeacherId(classId);
    const enrollment = await this.findAndValidateMember(classId, memberId);

    if (enrollment.status === EnrollmentStatus.suspended) {
      throw new BadRequestException('Member is already suspended');
    }

    if (enrollment.userId === headTeacherId) {
      throw new ForbiddenException('Cannot ban the class head teacher');
    }

    if (enrollment.roleIn === Role.teacher) {
      throw new ForbiddenException('Cannot ban a teacher or instructor');
    }

    const updated = await this.prisma.enrollment.update({
      where: { id: enrollment.id },
      data: {
        status: EnrollmentStatus.suspended,
      },
    });

    // TODO (Notification): Notify student about suspension from the class
    return {
      message: 'Member suspended successfully',
      data: updated,
    };
  }

  // Lift suspension / unban a class member
  async unbanMember(
    classId: string,
    memberId: string,
  ): Promise<{ message: string; data: unknown }> {
    const enrollment = await this.findAndValidateMember(
      classId,
      memberId,
      EnrollmentStatus.suspended,
      'Member is not currently suspended',
    );

    const updated = await this.prisma.enrollment.update({
      where: { id: enrollment.id },
      data: {
        status: EnrollmentStatus.approved,
        joinedAt: new Date(),
      },
    });

    // TODO (Notification): Notify student that suspension has been lifted
    return {
      message: 'Member suspension lifted successfully',
      data: updated,
    };
  }

  // Remove an enrolled student or assistant from the class
  async removeMember(
    currentUserId: string,
    classId: string,
    memberId: string,
  ): Promise<{ message: string }> {
    const headTeacherId = await this.getHeadTeacherId(classId);
    const enrollment = await this.findAndValidateMember(classId, memberId);

    if (enrollment.userId === headTeacherId) {
      throw new ForbiddenException('Cannot remove the class head teacher');
    }

    if (enrollment.roleIn === Role.teacher && headTeacherId !== currentUserId) {
      throw new ForbiddenException('Only class owner can remove co-teachers');
    }

    await this.prisma.enrollment.delete({
      where: { id: enrollment.id },
    });

    // TODO (Notification): Notify student that they were removed from the class
    return { message: 'Remove member successful' };
  }

  // Update a member role between teaching assistant and student
  async updateMemberRole(
    classId: string,
    memberId: string,
    role: Role,
  ): Promise<{ message: string; data: unknown }> {
    const headTeacherId = await this.getHeadTeacherId(classId);
    const enrollment = await this.findAndValidateMember(classId, memberId);

    if (enrollment.userId === headTeacherId && role !== Role.teacher) {
      throw new BadRequestException('Cannot change role of class head teacher');
    }

    const updated = await this.prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { roleIn: role },
    });

    // TODO (Notification): Notify member about role update
    return {
      message: 'Update member role successful',
      data: updated,
    };
  }

  // Resolves an enrollment and validates existence and optional status
  private async findAndValidateMember(
    classId: string,
    memberId: string,
    expectedStatus?: EnrollmentStatus,
    statusErrorMessage?: string,
  ) {
    const enrollment = await this.prisma.enrollment.findFirst({
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

  // Fetches head teacher ID for a class
  private async getHeadTeacherId(classId: string): Promise<string> {
    const cls = await this.prisma.class.findUnique({
      where: { id: classId },
      select: { teacherId: true },
    });

    if (!cls) {
      throw new NotFoundException('Class not found');
    }

    return cls.teacherId;
  }
}
