import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { EnrollmentStatus, Role } from 'src/generated/prisma/enums';
import { QueryEnrollmentDto } from './dto/query-enrollment.dto';
import { Prisma } from 'src/generated/prisma/client';
import { PaginatedResult } from 'src/common/interfaces/paginated-result.interface';
import { enrollmentSelect } from './utils/enrollment-select.utils';
import { EnrolledClassEntity } from './entities/enrolled-class.entity';

@Injectable()
export class EnrollmentsService {
  constructor(private readonly prisma: PrismaService) {}

  // Join or request enrollment into a class with school, privacy and banned checks
  async create(
    createEnrollmentDto: CreateEnrollmentDto,
    currentUserId?: string,
  ): Promise<unknown> {
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

    if (foundClass.isArchived) {
      throw new BadRequestException(
        'This class has been archived and cannot be joined',
      );
    }

    if (foundClass.schoolId !== foundUser.schoolId) {
      throw new BadRequestException(
        'User and class must belong to the same school',
      );
    }

    const targetRole = createEnrollmentDto.roleIn ?? Role.student;
    if (
      targetRole === Role.student &&
      foundClass.maxStudents &&
      foundClass.totalStudents >= foundClass.maxStudents
    ) {
      throw new BadRequestException(
        'This class has reached its maximum student capacity',
      );
    }

    const existed = await this.prisma.enrollment.findUnique({
      where: { classId_userId: { classId, userId } },
    });

    if (existed) {
      if (existed.status === EnrollmentStatus.suspended) {
        throw new ForbiddenException(
          'You have been banned from joining this class',
        );
      }
      if (existed.status === EnrollmentStatus.approved) {
        throw new BadRequestException('You are already enrolled in this class');
      }
      if (existed.status === EnrollmentStatus.pending) {
        throw new BadRequestException(
          'Your enrollment request is pending approval',
        );
      }

      // Re-applying after previous rejection always requires teacher approval
      const reapplyStatus = EnrollmentStatus.pending;

      const updated = await this.prisma.enrollment.update({
        where: { id: existed.id },
        select: enrollmentSelect,
        data: {
          status: reapplyStatus,
          roleIn: targetRole,
          isStarred: createEnrollmentDto.isStarred ?? false,
          joinedAt: null,
        },
      });

      // TODO (Notification): Notify teacher that a student has requested enrollment
      return updated;
    }

    // Joining a class always starts with pending status requiring teacher approval
    const initialStatus = EnrollmentStatus.pending;

    const created = await this.prisma.enrollment.create({
      select: enrollmentSelect,
      data: {
        classId,
        userId,
        roleIn: targetRole,
        status: initialStatus,
        isStarred: createEnrollmentDto.isStarred ?? false,
        joinedAt: null,
      },
    });

    // TODO (Notification): Notify teacher about new enrollment request
    return created;
  }

  // Get user enrollments with pagination and status filters
  async findAll(
    userId: string,
    query: QueryEnrollmentDto,
  ): Promise<PaginatedResult<EnrolledClassEntity>> {
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
          { subjectRef: { name: { contains: search, mode: 'insensitive' } } },
          { subjectRef: { code: { contains: search, mode: 'insensitive' } } },
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
        select: enrollmentSelect,
      }),
      this.prisma.enrollment.count({ where }),
    ]);

    const data = enrollments.map((e) => ({
      ...e.class,
      subject: e.class?.subjectRef?.name ?? null,
      totalStudents: e.class?.totalStudents ?? 0,
      enrollment: {
        id: e.id,
        status: e.status,
        isStarred: e.isStarred,
        roleIn: e.roleIn,
        joinedAt: e.joinedAt,
      },
    })) as unknown as EnrolledClassEntity[];

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

  // Get enrollment relation record by user and class
  async findOne(userId: string, classId: string): Promise<unknown> {
    return this.prisma.enrollment.findUnique({
      where: {
        classId_userId: {
          classId,
          userId,
        },
      },
      select: enrollmentSelect,
    });
  }

  // Get all starred classes for current user
  async getStarredClasses(
    userId: string,
  ): Promise<{ classes: EnrolledClassEntity[]; total: number }> {
    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        userId,
        isStarred: true,
        status: EnrollmentStatus.approved,
      },
      select: enrollmentSelect,
      orderBy: {
        joinedAt: 'desc',
      },
    });

    const data = enrollments.map((e) => ({
      ...e.class,
      subject: e.class?.subjectRef?.name ?? null,
      totalStudents: e.class?.totalStudents ?? 0,
      enrollment: {
        id: e.id,
        status: e.status,
        isStarred: e.isStarred,
        roleIn: e.roleIn,
        joinedAt: e.joinedAt,
      },
    })) as unknown as EnrolledClassEntity[];

    return {
      classes: data,
      total: data.length,
    };
  }

  // Toggle star status of an active enrollment
  async toggleStar(userId: string, enrollmentId: string): Promise<unknown> {
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

  // Student voluntarily leaves a class
  async leaveClass(
    userId: string,
    classId: string,
  ): Promise<{ message: string }> {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        classId_userId: {
          classId,
          userId,
        },
      },
    });

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
      where: {
        classId_userId: {
          classId,
          userId,
        },
      },
    });

    return { message: 'Leave class successful' };
  }
}
