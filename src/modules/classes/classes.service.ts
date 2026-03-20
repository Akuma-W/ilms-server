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
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { Role } from 'src/generated/prisma/enums';
import { randomBytes } from 'crypto';
import { UsersService } from '../users/users.service';
import { Prisma } from 'src/generated/prisma/client';

@Injectable()
export class ClassesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Create a new class.
   *
   * If the user is a teacher, the class is created for that teacher (belonging to the teacher's school).
   * If the user is an admin, the class is created and assigned to the corresponding teacher and school.
   *
   * @param user - The authenticated user performing the action.
   * @param createClassDto - The data required to create the class.
   * @returns The information of the newly created class.
   */
  async create(user: AuthUser, createClassDto: CreateClassDto) {
    // Check schoolId and teacherId base on Role
    const { schoolId, teacherId } = await this.getSchoolAndTeacher(
      user,
      createClassDto.schoolId,
      createClassDto.teacherId,
    );

    const courseCode = await this.generateUniqueCourseCode();

    const classroom = await this.prisma.class.create({
      data: {
        ...createClassDto,
        teacherId,
        schoolId,
        courseCode,
        isPrivate: createClassDto.isPrivate ?? false,
      },
    });

    // Teacher auto enrolls to class (Enrollment)
    await this.prisma.enrollment.create({
      data: {
        classId: classroom.id,
        userId: teacherId,
        roleIn: 'teacher',
        status: 'approved',
        joinedAt: new Date(),
      },
    });

    return classroom;
  }

  // Find all classes with query
  async findAll(userId: string, queryClassDto: QueryClassDto) {
    const user = await this.usersService.findOne(userId);

    const { keyword, page, limit } = queryClassDto;

    const skip = (page - 1) * limit;
    const take = limit;

    const where: Prisma.ClassWhereInput = {};

    if (user.role !== Role.admin) {
      where.isPrivate = false;
    }

    // Find by keyword
    if (keyword) {
      where.OR = [
        { title: { contains: keyword, mode: 'insensitive' } },
        { subject: { contains: keyword, mode: 'insensitive' } },
        { semester: { contains: keyword, mode: 'insensitive' } },
        { teacher: { fullName: { contains: keyword, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.class.findMany({
        where,
        skip,
        take,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          teacher: true,
        },
      }),
      this.prisma.class.count({ where: where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Find One Class by Id
  async findOne(classId: string) {
    const classroom = await this.prisma.class.findUnique({
      where: { id: classId },
      include: { teacher: true },
    });

    if (!classroom) {
      throw new NotFoundException('Class not found');
    }

    return classroom;
  }

  // Find One Class By Course Code
  async findByCourseCode(courseCode: string) {
    const classroom = await this.prisma.class.findUnique({
      where: { courseCode },
      include: { teacher: true },
    });

    if (!classroom) {
      throw new NotFoundException('Class not found');
    }

    return classroom;
  }

  // Find Current user's Classes | Class I teaching
  async findMyTeachingClasses(userId: string, query: QueryClassDto) {
    const { keyword, page, limit } = query;

    const skip = (page - 1) * limit;
    const take = limit;

    const where: Prisma.ClassWhereInput = {
      teacherId: userId,
    };

    if (keyword) {
      where.OR = [
        { title: { contains: keyword, mode: 'insensitive' } },
        { subject: { contains: keyword, mode: 'insensitive' } },
        { semester: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.class.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { teacher: true },
      }),
      this.prisma.class.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(
    user: AuthUser,
    classId: string,
    updateClassDto: UpdateClassDto,
  ) {
    // Check class existed
    const existing = await this.prisma.class.findUnique({
      where: { id: classId },
    });

    if (!existing) {
      throw new NotFoundException('Class not found');
    }

    // Check if user is admin or user is teacher managing this class
    if (user.role !== Role.admin && existing.teacherId !== user.id) {
      throw new ForbiddenException('You are not allowed to update this class');
    }

    await this.prisma.class.update({
      where: { id: classId },
      data: updateClassDto,
    });

    return { message: 'Cập nhật thành công' };
  }

  async remove(user: AuthUser, classId: string) {
    // Check class existed
    const existing = await this.prisma.class.findUnique({
      where: { id: classId },
    });

    if (!existing) {
      throw new NotFoundException('Class not found');
    }

    // Check if user is admin or user is teacher managing this class
    if (user.role !== Role.admin && existing.teacherId !== user.id) {
      throw new ForbiddenException('You are not allowed to update this class');
    }

    // Hard delete: delete enrollments in this class
    await this.prisma.$transaction([
      this.prisma.enrollment.deleteMany({ where: { classId } }),
      this.prisma.class.delete({ where: { id: classId } }),
    ]);

    return { message: 'Class deleted successfully' };
  }

  /** HELPERS
   * - select
   * - generate course code
   * - get school and teacher from request
   */
  private generateCode(): string {
    const code = randomBytes(4)
      .toString('base64') // encode
      .replace(/[^A-Z0-9]/gi, '') // remove strange character
      .toUpperCase()
      .slice(0, 6); // 6 digit

    return code;
  }

  private async generateUniqueCourseCode(): Promise<string> {
    for (let i = 0; i < 5; i++) {
      const code = this.generateCode();

      const found = await this.prisma.class.findUnique({
        where: { courseCode: code },
      });

      if (!found) return code;
    }
    throw new Error('Failed to generate unique course code');
  }

  private async getSchoolAndTeacher(
    user: AuthUser,
    schoolId: string | undefined,
    teacherId: string | undefined,
  ): Promise<{ schoolId: string; teacherId: string }> {
    // If user is Teacher
    if (user.role === Role.teacher) {
      const teacher = await this.usersService.findOne(user.id);

      if (!teacher) {
        throw new NotFoundException('Teacher not found');
      }

      return {
        schoolId: teacher.schoolId,
        teacherId: teacher.id,
      };
    }
    if (user.role === Role.admin) {
      if (!schoolId || !teacherId) {
        throw new BadRequestException('School and Teacher are required');
      }

      return { schoolId, teacherId };
    }

    throw new ForbiddenException('Invalid role');
  }
}
