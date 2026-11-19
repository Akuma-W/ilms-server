import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { Prisma } from 'src/generated/prisma/client';
import { Role } from 'src/generated/prisma/enums';
import { PaginatedResult } from 'src/common/interfaces/paginated-result.interface';
import { AdminClassEntity } from './entities/admin-class.entity';
import { QueryAdminClassesDto } from './dto/query-admin-classes.dto';
import { CreateAdminClassDto } from './dto/create-admin-class.dto';
import { UpdateAdminClassDto } from './dto/update-admin-class.dto';
import { AdminActionResult } from '../interfaces/admin-action-result.interface';
import { generateUniqueCourseCode } from 'src/modules/academic/classes/utils/course-code.util';

@Injectable()
export class AdminClassesService {
  constructor(private readonly prisma: PrismaService) {}

  // Lists all classrooms across system with multi-tiered filtering by school, subject and archived status
  async findAll(
    query: QueryAdminClassesDto,
  ): Promise<PaginatedResult<AdminClassEntity>> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const where: Prisma.ClassWhereInput = {};

    if (query.schoolId) where.schoolId = query.schoolId;
    if (query.subjectId) where.subjectId = query.subjectId;
    if (query.isArchived !== undefined) where.isArchived = query.isArchived;

    if (query.search?.trim()) {
      const keyword = query.search.trim();
      where.OR = [
        { title: { contains: keyword, mode: 'insensitive' } },
        { courseCode: { contains: keyword, mode: 'insensitive' } },
        { teacher: { fullName: { contains: keyword, mode: 'insensitive' } } },
      ];
    }

    const [total, classes] = await Promise.all([
      this.prisma.class.count({ where }),
      this.prisma.class.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ createdAt: 'desc' }],
        include: {
          teacher: {
            select: {
              id: true,
              fullName: true,
              email: true,
              avatarUrl: true,
            },
          },
          subjectRef: {
            select: {
              id: true,
              code: true,
              name: true,
              credits: true,
            },
          },
          school: {
            select: {
              id: true,
              name: true,
              shortname: true,
            },
          },
        },
      }),
    ]);

    return {
      data: classes as AdminClassEntity[],
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Retrieves classroom details by unique identifier
  async findOne(id: string): Promise<AdminClassEntity> {
    const classroom = await this.prisma.class.findUnique({
      where: { id },
      include: {
        teacher: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
          },
        },
        subjectRef: {
          select: {
            id: true,
            code: true,
            name: true,
            credits: true,
          },
        },
        school: {
          select: {
            id: true,
            name: true,
            shortname: true,
          },
        },
      },
    });

    if (!classroom) {
      throw new NotFoundException('Classroom not found');
    }

    return classroom as AdminClassEntity;
  }

  // Creates classroom directly as administrator
  async create(dto: CreateAdminClassDto): Promise<AdminClassEntity> {
    const [school, subject, teacher] = await Promise.all([
      this.prisma.school.findUnique({ where: { id: dto.schoolId } }),
      this.prisma.subject.findUnique({ where: { id: dto.subjectId } }),
      this.prisma.user.findUnique({ where: { id: dto.teacherId } }),
    ]);

    if (!school) throw new NotFoundException('School not found');
    if (!subject) throw new NotFoundException('Subject not found');
    if (!teacher || teacher.role !== Role.teacher) {
      throw new BadRequestException(
        'Assigned instructor must be a valid teacher account',
      );
    }

    let courseCode = dto.courseCode?.trim().toUpperCase();
    if (courseCode) {
      const existing = await this.prisma.class.findUnique({
        where: { courseCode },
      });
      if (existing) throw new BadRequestException('Course code already exists');
    } else {
      courseCode = await generateUniqueCourseCode(this.prisma);
    }

    const created = await this.prisma.class.create({
      data: {
        title: dto.title.trim(),
        schoolId: dto.schoolId,
        subjectId: dto.subjectId,
        teacherId: dto.teacherId,
        courseCode,
        maxStudents: dto.maxStudents ?? 60,
        isPrivate: dto.isPrivate ?? false,
        totalStudents: 0,
      },
    });

    return this.findOne(created.id);
  }

  // Updates classroom settings as administrator
  async update(
    id: string,
    dto: UpdateAdminClassDto,
  ): Promise<AdminClassEntity> {
    await this.findOne(id);

    if (dto.teacherId) {
      const teacher = await this.prisma.user.findUnique({
        where: { id: dto.teacherId },
      });
      if (!teacher || teacher.role !== Role.teacher) {
        throw new BadRequestException(
          'Assigned instructor must be a valid teacher account',
        );
      }
    }

    await this.prisma.class.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title.trim() }),
        ...(dto.teacherId !== undefined && { teacherId: dto.teacherId }),
        ...(dto.maxStudents !== undefined && { maxStudents: dto.maxStudents }),
        ...(dto.isPrivate !== undefined && { isPrivate: dto.isPrivate }),
      },
    });

    return this.findOne(id);
  }

  // Toggles read-only archive status of classroom
  async toggleArchive(
    id: string,
    isArchived: boolean,
  ): Promise<AdminClassEntity> {
    await this.findOne(id);

    await this.prisma.class.update({
      where: { id },
      data: { isArchived },
    });

    return this.findOne(id);
  }

  // Force removes classroom and cascades attached records
  async remove(id: string): Promise<AdminActionResult> {
    await this.findOne(id);

    await this.prisma.class.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Class deleted successfully',
    };
  }
}
