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
import { executeAddAssistant } from './utils/class-member-assistant.util';
import {
  ensureStudentCapacity,
  findAndValidateMember,
  getHeadTeacherId,
} from './utils/class-member-validator.util';
import { buildClassMemberEntity } from './utils/class-member-mapper.util';

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

      members.push(
        buildClassMemberEntity(
          'owner',
          targetClass.teacher,
          avatarUrl,
          Role.teacher,
          EnrollmentStatus.approved,
          targetClass.createdAt,
        ),
      );
    }

    for (const e of enrollments) {
      const avatarUrl = e.user.avatarUrl
        ? await this.storage.getAvatarUrl(e.user.avatarUrl)
        : null;

      members.push(
        buildClassMemberEntity(
          e.id,
          e.user,
          avatarUrl,
          e.roleIn,
          e.status,
          e.joinedAt,
        ),
      );
    }

    return members;
  }

  // Add an assistant teacher directly to the class (Method 2)
  async addAssistant(
    classId: string,
    assistantUserId: string,
    currentUserId: string,
    currentUserRole: Role,
  ): Promise<{ message: string; data: unknown }> {
    return executeAddAssistant(
      this.prisma,
      classId,
      assistantUserId,
      currentUserId,
      currentUserRole,
    );
  }

  // Approve a pending student enrollment request
  async approveMember(
    classId: string,
    memberId: string,
  ): Promise<{ message: string; data: unknown }> {
    const enrollment = await findAndValidateMember(
      this.prisma,
      classId,
      memberId,
      EnrollmentStatus.pending,
      'Enrollment is not pending approval',
    );

    if (enrollment.roleIn === Role.student) {
      await ensureStudentCapacity(this.prisma, classId);
      await this.prisma.class.update({
        where: { id: classId },
        data: { totalStudents: { increment: 1 } },
      });
    }

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
    const enrollment = await findAndValidateMember(
      this.prisma,
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
    const enrollment = await findAndValidateMember(
      this.prisma,
      classId,
      memberId,
      EnrollmentStatus.rejected,
      'Enrollment is not currently rejected',
    );

    if (enrollment.roleIn === Role.student) {
      await ensureStudentCapacity(this.prisma, classId);
      await this.prisma.class.update({
        where: { id: classId },
        data: { totalStudents: { increment: 1 } },
      });
    }

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
    const headTeacherId = await getHeadTeacherId(this.prisma, classId);
    const enrollment = await findAndValidateMember(
      this.prisma,
      classId,
      memberId,
    );

    if (enrollment.status === EnrollmentStatus.suspended) {
      throw new BadRequestException('Member is already suspended');
    }

    if (enrollment.userId === headTeacherId) {
      throw new ForbiddenException('Cannot ban the class head teacher');
    }

    if (enrollment.roleIn === Role.teacher) {
      throw new ForbiddenException('Cannot ban a teacher or instructor');
    }

    if (enrollment.status === EnrollmentStatus.approved) {
      await this.prisma.class.update({
        where: { id: classId },
        data: { totalStudents: { decrement: 1 } },
      });
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

  // Lift suspension / unban a class member (either approve directly or reset to allow re-applying)
  async unbanMember(
    classId: string,
    memberId: string,
    resetOnly: boolean = false,
  ): Promise<{ message: string; data: unknown }> {
    const enrollment = await findAndValidateMember(
      this.prisma,
      classId,
      memberId,
      EnrollmentStatus.suspended,
      'Member is not currently suspended',
    );

    if (resetOnly) {
      const updated = await this.prisma.enrollment.update({
        where: { id: enrollment.id },
        data: {
          status: EnrollmentStatus.rejected,
        },
      });

      return {
        message: 'Member suspension lifted. Student can now re-apply',
        data: updated,
      };
    }

    await ensureStudentCapacity(this.prisma, classId);
    await this.prisma.class.update({
      where: { id: classId },
      data: { totalStudents: { increment: 1 } },
    });

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
    const headTeacherId = await getHeadTeacherId(this.prisma, classId);
    const enrollment = await findAndValidateMember(
      this.prisma,
      classId,
      memberId,
    );

    if (enrollment.userId === headTeacherId) {
      throw new ForbiddenException('Cannot remove the class head teacher');
    }

    if (enrollment.roleIn === Role.teacher && headTeacherId !== currentUserId) {
      throw new ForbiddenException('Only class owner can remove co-teachers');
    }

    if (
      enrollment.roleIn === Role.student &&
      enrollment.status === EnrollmentStatus.approved
    ) {
      await this.prisma.class.update({
        where: { id: classId },
        data: { totalStudents: { decrement: 1 } },
      });
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
    const headTeacherId = await getHeadTeacherId(this.prisma, classId);
    const enrollment = await findAndValidateMember(
      this.prisma,
      classId,
      memberId,
    );

    if (enrollment.userId === headTeacherId && role !== Role.teacher) {
      throw new BadRequestException('Cannot change role of class head teacher');
    }

    if (enrollment.roleIn === role) {
      return { message: 'Member already has this role', data: enrollment };
    }

    if (role === Role.student) {
      await ensureStudentCapacity(this.prisma, classId);
      if (enrollment.status === EnrollmentStatus.approved) {
        await this.prisma.class.update({
          where: { id: classId },
          data: { totalStudents: { increment: 1 } },
        });
      }
    } else if (
      enrollment.roleIn === Role.student &&
      enrollment.status === EnrollmentStatus.approved
    ) {
      await this.prisma.class.update({
        where: { id: classId },
        data: { totalStudents: { decrement: 1 } },
      });
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
}
