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
import { Prisma } from 'src/generated/prisma/client';

@Injectable()
export class EnrollmentsService {
  constructor(private readonly prisma: PrismaService) {}

  // Join or request enrollment into a class with school and privacy validations
  async create(
    createEnrollmentDto: CreateEnrollmentDto,
    currentUserId?: string,
  ) {
    const classId = createEnrollmentDto.classId;
    const userId = currentUserId || createEnrollmentDto.userId;

    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    const [foundClass, foundUser] = await Promise.all([
      this.prisma.class.findUnique({ where: { id: classId } }),
      this.prisma.user.findUnique({ where: { id: userId } }),
    ]);

    if (!foundClass) {
      throw new NotFoundException('Class not found');
    }

    if (!foundUser) {
      throw new NotFoundException('User not found');
    }

    if (foundClass.schoolId !== foundUser.schoolId) {
      throw new BadRequestException(
        'User and class must belong to the same school',
      );
    }

    const existed = await this.prisma.enrollment.findUnique({
      where: { classId_userId: { classId, userId } },
    });

    if (existed) {
      if (existed.status === EnrollmentStatus.approved) {
        throw new BadRequestException('You are already enrolled in this class');
      }
      if (existed.status === EnrollmentStatus.pending) {
        throw new BadRequestException(
          'Your enrollment request is pending approval',
        );
      }

      const reapplyStatus = foundClass.isPrivate
        ? EnrollmentStatus.pending
        : EnrollmentStatus.approved;

      return this.prisma.enrollment.update({
        where: { id: existed.id },
        select: this.enrollmentSelect,
        data: {
          status: reapplyStatus,
          roleIn: createEnrollmentDto.roleIn ?? Role.student,
          isStarred: createEnrollmentDto.isStarred ?? false,
          joinedAt:
            reapplyStatus === EnrollmentStatus.approved ? new Date() : null,
        },
      });
    }

    const initialStatus = foundClass.isPrivate
      ? EnrollmentStatus.pending
      : EnrollmentStatus.approved;

    return this.prisma.enrollment.create({
      select: this.enrollmentSelect,
      data: {
        classId,
        userId,
        roleIn: createEnrollmentDto.roleIn ?? Role.student,
        status: initialStatus,
        isStarred: createEnrollmentDto.isStarred ?? false,
        joinedAt:
          initialStatus === EnrollmentStatus.approved ? new Date() : null,
      },
    });
  }

  // Get user enrollments with accurate total count and pagination
  async findAll(userId: string, query: QueryEnrollmentDto) {
    const { status, isStarred, page, limit, search } = query;

    const skip = (page - 1) * limit;
    const take = limit;

    const where: Prisma.EnrollmentWhereInput = {
      userId,
      ...(status && { status }),
      ...(isStarred !== undefined && { isStarred }),
    };

    if (search) {
      where.class = {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { subject: { contains: search, mode: 'insensitive' } },
          { courseCode: { contains: search, mode: 'insensitive' } },
          { semester: { contains: search, mode: 'insensitive' } },
          { teacher: { fullName: { contains: search, mode: 'insensitive' } } },
        ],
      };
    }

    const [enrollments, total] = await Promise.all([
      this.prisma.enrollment.findMany({
        where,
        skip,
        take,
        orderBy: {
          joinedAt: 'desc',
        },
        select: this.enrollmentSelect,
      }),
      this.prisma.enrollment.count({ where }),
    ]);

    const data = enrollments.map((e) => ({
      ...e.class,
      totalStudents: e.class?._count?.enrollments ?? 0,
      enrollment: {
        id: e.id,
        status: e.status,
        isStarred: e.isStarred,
        roleIn: e.roleIn,
        joinedAt: e.joinedAt,
      },
    }));

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  // Get enrollment by user and class
  async findOne(userId: string, classId: string) {
    return this.prisma.enrollment.findUnique({
      where: {
        classId_userId: {
          classId,
          userId,
        },
      },
      select: this.enrollmentSelect,
    });
  }

  // Get all starred classes for user
  async getStarredClasses(userId: string) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        userId,
        isStarred: true,
        status: EnrollmentStatus.approved,
      },
      select: this.enrollmentSelect,
      orderBy: {
        joinedAt: 'desc',
      },
    });

    const data = enrollments.map((e) => ({
      ...e.class,
      totalStudents: e.class?._count?.enrollments ?? 0,
      enrollment: {
        id: e.id,
        status: e.status,
        isStarred: e.isStarred,
        roleIn: e.roleIn,
        joinedAt: e.joinedAt,
      },
    }));

    return {
      classes: data,
      total: data.length,
    };
  }

  // Update enrollment (teacher)
  async update(
    userId: string,
    classId: string,
    targetUserId: string,
    updateEnrollmentDto: UpdateEnrollmentDto,
  ) {
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

  // Mark/remove star in a class had joined
  async toggleStar(userId: string, enrollmentId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
    });

    if (!enrollment || enrollment.userId !== userId) {
      throw new ForbiddenException();
    }

    if (enrollment.status !== EnrollmentStatus.approved) {
      throw new BadRequestException('Cannot star inactive class');
    }

    return this.prisma.enrollment.update({
      where: { id: enrollmentId },
      data: {
        isStarred: !enrollment.isStarred,
      },
    });
  }

  // Approve enrollment
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
        joinedAt: new Date(),
      },
    });

    return {
      message: 'Approve enrollment successful',
      data: updated,
    };
  }

  // Reject enrollment
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

  // Check teacher permission for this class
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

  // Select fields definition for enrollments query
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
        courseCode: true,
        subject: true,
        semester: true,
        isPrivate: true,
        meetingUri: true,
        meetingSpaceId: true,
        isArchived: true,
        createdAt: true,
        schoolId: true,
        teacherId: true,
        school: {
          select: {
            id: true,
            name: true,
          },
        },
        teacher: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
            role: true,
          },
        },
        _count: {
          select: {
            enrollments: {
              where: {
                roleIn: Role.student,
                status: EnrollmentStatus.approved,
              },
            },
          },
        },
      },
    },
  };
}
