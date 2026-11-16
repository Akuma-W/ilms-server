import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { QueryClassDto } from './dto/query-class.dto';
import { AuthUser } from 'src/modules/auth/session/interfaces/auth-user.interface';
import { EnrollmentStatus, Role } from 'src/generated/prisma/enums';
import { UsersService } from 'src/modules/users/users.service';
import { Prisma } from 'src/generated/prisma/client';
import { AdminCreateClassDto } from './dto/admin-create-class.dto';
import { ClassEntity } from './entities/class.entity';
import { PaginatedResult } from 'src/common/interfaces/paginated-result.interface';
import { generateUniqueCourseCode } from './utils/course-code.util';
import {
  classDetailInclude,
  getClassListInclude,
} from './utils/class-include.util';

type PaginatedClassesResult = PaginatedResult<
  ClassEntity & { totalStudents: number; enrollment: unknown }
>;

@Injectable()
export class ClassesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  // Creates a new class and automatically enrolls the teacher as approved owner
  async create(
    schoolId: string,
    teacherId: string,
    createClassDto: CreateClassDto,
  ): Promise<ClassEntity> {
    const courseCode = await generateUniqueCourseCode(this.prisma);

    const classroom = await this.prisma.class.create({
      data: {
        ...createClassDto,
        courseCode,
        schoolId,
        teacherId,
      },
    });

    await this.prisma.enrollment.create({
      data: {
        classId: classroom.id,
        userId: teacherId,
        roleIn: Role.teacher,
        status: EnrollmentStatus.approved,
        joinedAt: new Date(),
      },
    });

    return classroom;
  }

  // Creates a class on behalf of a teacher
  async createByTeacher(
    userId: string,
    createClassDto: CreateClassDto,
  ): Promise<ClassEntity> {
    const { schoolId } = await this.usersService.findOne(userId);

    return this.create(schoolId, userId, createClassDto);
  }

  // Creates a class on behalf of an administrator
  async createByAdmin(
    adminCreateClassDto: AdminCreateClassDto,
  ): Promise<ClassEntity> {
    const { schoolId, teacherId } = adminCreateClassDto;

    return this.create(schoolId, teacherId, adminCreateClassDto);
  }

  // Find all public classes in user's school excluding archived ones by default
  async findAll(
    userId: string,
    queryClassDto: QueryClassDto,
  ): Promise<PaginatedClassesResult> {
    const user = await this.usersService.findOne(userId);
    const { search, page, limit, isArchived } = queryClassDto;

    const skip = (page - 1) * limit;
    const take = limit;

    const where: Prisma.ClassWhereInput = {
      isPrivate: false,
      schoolId: user.schoolId,
      isArchived: isArchived !== undefined ? isArchived : false,
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
        { semester: { contains: search, mode: 'insensitive' } },
        { teacher: { fullName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [result, total] = await Promise.all([
      this.prisma.class.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: getClassListInclude(userId),
      }),
      this.prisma.class.count({ where }),
    ]);

    const data = result.map((cls) => ({
      ...cls,
      enrollment: cls.enrollments[0] || null,
      totalStudents: cls._count?.enrollments ?? 0,
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

  // Find single class by unique identifier
  async findOne(
    classId: string,
  ): Promise<ClassEntity & { totalStudents: number }> {
    const classroom = await this.prisma.class.findUnique({
      where: { id: classId },
      include: classDetailInclude,
    });

    if (!classroom) {
      throw new NotFoundException('Class not found');
    }

    return {
      ...classroom,
      totalStudents: classroom._count?.enrollments ?? 0,
    };
  }

  // Find single class by 6-character course code
  async findByCourseCode(
    courseCode: string,
  ): Promise<ClassEntity & { totalStudents: number }> {
    const classroom = await this.prisma.class.findUnique({
      where: { courseCode },
      include: classDetailInclude,
    });

    if (!classroom) {
      throw new NotFoundException('Class not found');
    }

    return {
      ...classroom,
      totalStudents: classroom._count?.enrollments ?? 0,
    };
  }

  // Find all classes created by currently authenticated teacher
  async findMyTeachingClasses(
    userId: string,
    query: QueryClassDto,
  ): Promise<PaginatedClassesResult> {
    const { search: keyword, page, limit, isArchived } = query;

    const skip = (page - 1) * limit;
    const take = limit;

    const where: Prisma.ClassWhereInput = {
      teacherId: userId,
      ...(isArchived !== undefined && { isArchived }),
    };

    if (keyword) {
      where.OR = [
        { title: { contains: keyword, mode: 'insensitive' } },
        { subject: { contains: keyword, mode: 'insensitive' } },
        { semester: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    const [result, total] = await Promise.all([
      this.prisma.class.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: getClassListInclude(userId),
      }),
      this.prisma.class.count({ where }),
    ]);

    const data = result.map((cls) => ({
      ...cls,
      enrollment: cls.enrollments[0] || null,
      totalStudents: cls._count?.enrollments ?? 0,
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

  // Updates class attributes for owner or administrator
  async update(
    user: AuthUser,
    classId: string,
    updateClassDto: UpdateClassDto,
  ): Promise<{ message: string }> {
    await this.findClassWithPermission(user, classId, 'update');

    await this.prisma.class.update({
      where: { id: classId },
      data: updateClassDto,
    });

    return { message: 'Class updated successfully' };
  }

  // Archives a class and sets it into read-only mode
  async archiveClass(
    user: AuthUser,
    classId: string,
  ): Promise<{ message: string }> {
    const existing = await this.findClassWithPermission(
      user,
      classId,
      'archive',
    );

    if (existing.isArchived) {
      throw new BadRequestException('Class is already archived');
    }

    await this.prisma.class.update({
      where: { id: classId },
      data: { isArchived: true },
    });

    // TODO (Notification): Notify enrolled students that class has been archived
    return { message: 'Class archived successfully' };
  }

  // Unarchives a class and restores mutation privileges
  async unarchiveClass(
    user: AuthUser,
    classId: string,
  ): Promise<{ message: string }> {
    const existing = await this.findClassWithPermission(
      user,
      classId,
      'unarchive',
    );

    if (!existing.isArchived) {
      throw new BadRequestException('Class is not archived');
    }

    await this.prisma.class.update({
      where: { id: classId },
      data: { isArchived: false },
    });

    // TODO (Notification): Notify enrolled students that class has been restored
    return { message: 'Class unarchived successfully' };
  }

  // Hard deletes class and cascades enrollment removals in a transaction
  async remove(user: AuthUser, classId: string): Promise<{ message: string }> {
    await this.findClassWithPermission(user, classId, 'delete');

    await this.prisma.$transaction([
      this.prisma.enrollment.deleteMany({ where: { classId } }),
      this.prisma.class.delete({ where: { id: classId } }),
    ]);

    return { message: 'Class deleted successfully' };
  }

  // Helper verifying that the target class exists and user is owner or administrator
  private async findClassWithPermission(
    user: AuthUser,
    classId: string,
    action: string,
  ) {
    const existing = await this.prisma.class.findUnique({
      where: { id: classId },
    });

    if (!existing) {
      throw new NotFoundException('Class not found');
    }

    if (user.role !== Role.admin && existing.teacherId !== user.id) {
      throw new ForbiddenException(
        `You are not allowed to ${action} this class`,
      );
    }

    return existing;
  }
}
