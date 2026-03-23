import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { EnrollmentStatus, Role } from 'src/generated/prisma/enums';
import { QueryEnrollmentDto } from './dto/query-enrollment.dto';

@Injectable()
export class EnrollmentsService {
  constructor(private readonly prisma: PrismaService) {}

  // Join class
  async create(createEnrollmentDto: CreateEnrollmentDto) {
    const { userId, classId } = createEnrollmentDto;

    // Check class existed
    const foundClass = await this.prisma.class.findUnique({
      where: { id: classId },
    });

    if (!foundClass) {
      throw new NotFoundException('Class not found');
    }

    // Check if user joined
    const existed = await this.prisma.enrollment.findUnique({
      where: { classId_userId: { classId, userId } },
    });

    if (existed) {
      throw new BadRequestException('You have joined to this class');
    }

    const enrollment = await this.prisma.enrollment.create({
      data: createEnrollmentDto,
    });

    return {
      message: 'Join class successful',
      data: enrollment,
    };
  }

  // Get user enrollments
  async findAll(userId: string, query: QueryEnrollmentDto) {
    const { status } = query;

    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        userId,
        ...(status && { status }),
      },
      orderBy: {
        joinedAt: 'desc',
      },
      select: this.enrollmentSelect,
    });

    return {
      message: 'Get enrollments successful',
      data: enrollments,
    };
  }

  // Get enrollment by user and class
  async findOne(userId: string, classId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        classId_userId: {
          classId,
          userId,
        },
      },
      select: this.enrollmentSelect,
    });

    return enrollment;
  }

  // Update enrollment (teacher)
  async update(
    userId: string,
    classId: string,
    targetUserId: string,
    updateEnrollmentDto: UpdateEnrollmentDto,
  ) {
    // Check if teacher has permission
    await this.checkTeacherPermission(userId, classId);

    const enrollment = await this.findOne(targetUserId, classId);

    if (!enrollment) {
      throw new NotFoundException('Enrollment does not exist');
    }

    const updated = await this.prisma.enrollment.update({
      where: {
        classId_userId: {
          classId,
          userId: targetUserId,
        },
      },
      select: this.enrollmentSelect,
      data: {
        ...updateEnrollmentDto,
      },
    });

    return {
      message: 'Update enrollment successful',
      data: updated,
    };
  }

  // UPDATE: Approve enrollment
  async approveEnrollment(
    currentUserId: string,
    classId: string,
    studentId: string,
  ) {
    await this.checkTeacherPermission(currentUserId, classId);

    const enrollment = await this.findOne(studentId, classId);

    if (!enrollment) {
      throw new NotFoundException('Enrollment does not exist');
    }

    if (enrollment.status !== EnrollmentStatus.pending) {
      throw new BadRequestException('Enrollment must be pending');
    }

    const updated = await this.prisma.enrollment.update({
      where: {
        classId_userId: {
          classId,
          userId: studentId,
        },
      },
      select: this.enrollmentSelect,
      data: {
        status: EnrollmentStatus.approved,
      },
    });

    return {
      message: 'Approve enrollment successful',
      data: updated,
    };
  }

  // UPDATE: Approve enrollment
  async rejectEnrollment(
    currentUserId: string,
    classId: string,
    studentId: string,
  ) {
    await this.checkTeacherPermission(currentUserId, classId);

    const enrollment = await this.findOne(studentId, classId);

    if (!enrollment) {
      throw new NotFoundException('Enrollment does not exist');
    }

    if (enrollment.status !== EnrollmentStatus.pending) {
      throw new BadRequestException('Enrollment must be pending');
    }

    const updated = await this.prisma.enrollment.update({
      where: {
        classId_userId: {
          classId,
          userId: studentId,
        },
      },
      select: this.enrollmentSelect,
      data: {
        status: EnrollmentStatus.rejected,
      },
    });

    return {
      message: 'Reject enrollment successful',
      data: updated,
    };
  }

  // Leave class
  async leaveClass(userId: string, classId: string) {
    const enrollment = await this.findOne(userId, classId);

    if (!enrollment) {
      throw new NotFoundException('Enrollment does not exist');
    }

    // Check if user is teacher of class
    if (enrollment.roleIn === Role.teacher) {
      const teacherCount = await this.prisma.enrollment.count({
        where: {
          classId,
          roleIn: Role.teacher,
          status: EnrollmentStatus.approved,
        },
      });

      if (teacherCount <= 1) {
        throw new BadRequestException('Class must have at least 1 teacher');
      }
    }

    // delete enrollment
    await this.prisma.enrollment.delete({
      where: {
        classId_userId: {
          classId,
          userId,
        },
      },
    });

    return { message: 'Leave class successful' };
  }

  // Teacher remove student
  async removeStudent(
    currentUserId: string,
    classId: string,
    studentId: string,
  ) {
    await this.checkTeacherPermission(currentUserId, classId);

    const enrollment = await this.findOne(studentId, classId);

    if (!enrollment) {
      throw new NotFoundException('Enrollment does not exist');
    }

    // Can't remove other teacher
    if (enrollment.roleIn === Role.teacher) {
      throw new ForbiddenException("Can't remove other teacher");
    }

    await this.prisma.enrollment.delete({
      where: {
        classId_userId: {
          classId,
          userId: studentId,
        },
      },
    });

    return { message: 'Remove student successful' };
  }

  /** HELPER */
  private async checkTeacherPermission(userId: string, classId: string) {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        userId,
        classId,
        roleIn: Role.teacher,
        status: EnrollmentStatus.approved,
      },
    });

    if (!enrollment) {
      throw new ForbiddenException('You are not teacher of this class');
    }

    return enrollment;
  }

  /** HELPER: select enrollments with class */
  private enrollmentSelect = {
    id: true,
    userId: true,
    classId: true,
    roleIn: true,
    isStarred: true,
    status: true,
    joinedAt: true,

    class: {
      select: {
        id: true,
        title: true,
        description: true,
        school: {
          select: {
            id: true,
            name: true,
          },
        },
        teacher: {
          select: {
            fullName: true,
          },
        },
      },
    },
  };
}
