import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { Role } from 'src/generated/prisma/enums';
import type { AuthUser } from 'src/modules/auth/session/interfaces/auth-user.interface';
import type { PaginatedResult } from 'src/common/interfaces/paginated-result.interface';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { QuerySubjectDto } from './dto/query-subject.dto';
import { SubjectEntity } from './entities/subject.entity';
import type { SubjectClassItem } from './interfaces/subject-classes-result.interface';

@Injectable()
export class SubjectsService {
  constructor(private readonly prisma: PrismaService) {}

  // Creates a new subject under a designated school (Admin only)
  async create(dto: CreateSubjectDto): Promise<SubjectEntity> {
    const school = await this.prisma.school.findUnique({
      where: { id: dto.schoolId },
      select: { id: true },
    });
    if (!school) {
      throw new NotFoundException('School not found');
    }

    const existingCode = await this.prisma.subject.findUnique({
      where: {
        schoolId_code: {
          schoolId: dto.schoolId,
          code: dto.code,
        },
      },
      select: { id: true },
    });
    if (existingCode) {
      throw new ConflictException(
        'Subject with this code already exists in this school',
      );
    }

    const subject = await this.prisma.subject.create({
      data: {
        schoolId: dto.schoolId,
        code: dto.code,
        name: dto.name,
        description: dto.description,
        credits: dto.credits ?? 3,
        isActive: dto.isActive ?? true,
      },
    });

    return subject as SubjectEntity;
  }

  // Retrieves paginated list of subjects filtered by role and criteria
  async findAll(
    user: AuthUser,
    query: QuerySubjectDto,
  ): Promise<PaginatedResult<SubjectEntity>> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 20;
    const skip = (page - 1) * limit;

    let targetSchoolId = query.schoolId;

    if (user.role !== Role.admin) {
      const userRecord = await this.prisma.user.findUnique({
        where: { id: user.id },
        select: { schoolId: true },
      });
      targetSchoolId = userRecord?.schoolId ?? undefined;
      if (!targetSchoolId) {
        return {
          data: [],
          meta: { page, limit, total: 0, totalPages: 0 },
        };
      }
    }

    const whereCondition: Record<string, unknown> = {};

    if (targetSchoolId) {
      whereCondition.schoolId = targetSchoolId;
    }

    if (query.isActive !== undefined) {
      whereCondition.isActive = query.isActive;
    }

    if (query.search?.trim()) {
      const keyword = query.search.trim();
      whereCondition.OR = [
        { code: { contains: keyword, mode: 'insensitive' } },
        { name: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    const [total, records] = await Promise.all([
      this.prisma.subject.count({ where: whereCondition }),
      this.prisma.subject.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: [{ code: 'asc' }, { createdAt: 'desc' }],
      }),
    ]);

    return {
      data: records as SubjectEntity[],
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Retrieves single subject with access boundary check
  async findOne(id: string, user: AuthUser): Promise<SubjectEntity> {
    const subject = await this.prisma.subject.findUnique({
      where: { id },
    });
    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    if (user.role !== Role.admin) {
      const userRecord = await this.prisma.user.findUnique({
        where: { id: user.id },
        select: { schoolId: true },
      });
      if (!userRecord || userRecord.schoolId !== subject.schoolId) {
        throw new ForbiddenException(
          'You can only view subjects belonging to your school',
        );
      }
    }

    return subject as SubjectEntity;
  }

  // Updates subject attributes and prevents code collisions
  async update(id: string, dto: UpdateSubjectDto): Promise<SubjectEntity> {
    const existing = await this.prisma.subject.findUnique({
      where: { id },
      select: { id: true, schoolId: true, code: true },
    });
    if (!existing) {
      throw new NotFoundException('Subject not found');
    }

    const targetSchoolId = dto.schoolId ?? existing.schoolId;
    const targetCode = dto.code ?? existing.code;

    if (dto.code && (dto.code !== existing.code || dto.schoolId)) {
      const codeDuplicate = await this.prisma.subject.findUnique({
        where: {
          schoolId_code: {
            schoolId: targetSchoolId,
            code: targetCode,
          },
        },
        select: { id: true },
      });
      if (codeDuplicate && codeDuplicate.id !== id) {
        throw new ConflictException(
          'Subject with this code already exists in this school',
        );
      }
    }

    const updated = await this.prisma.subject.update({
      where: { id },
      data: {
        schoolId: dto.schoolId,
        code: dto.code,
        name: dto.name,
        description: dto.description,
        credits: dto.credits,
        isActive: dto.isActive,
      },
    });

    return updated as SubjectEntity;
  }

  // Deletes subject if no active or historical classes exist
  async remove(id: string): Promise<{ message: string }> {
    const existing = await this.prisma.subject.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException('Subject not found');
    }

    const linkedClassCount = await this.prisma.class.count({
      where: { subjectId: id },
    });
    if (linkedClassCount > 0) {
      throw new BadRequestException(
        'Cannot delete subject with existing classes. Consider deactivating it instead.',
      );
    }

    await this.prisma.subject.delete({
      where: { id },
    });

    return { message: 'Subject deleted successfully' };
  }

  // Finds all non-archived classes assigned to this subject
  async findSubjectClasses(
    subjectId: string,
    user: AuthUser,
  ): Promise<SubjectClassItem[]> {
    await this.findOne(subjectId, user);

    const classes = await this.prisma.class.findMany({
      where: {
        subjectId,
        isArchived: false,
      },
      select: {
        id: true,
        title: true,
        courseCode: true,
        semester: true,
        isPrivate: true,
        totalStudents: true,
        maxStudents: true,
        createdAt: true,
        subjectRef: {
          select: {
            name: true,
          },
        },
        teacher: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return classes.map((c) => ({
      id: c.id,
      title: c.title,
      subject: c.subjectRef?.name ?? '',
      courseCode: c.courseCode,
      semester: c.semester,
      isPrivate: c.isPrivate,
      totalStudents: c.totalStudents,
      maxStudents: c.maxStudents,
      createdAt: c.createdAt,
      teacher: c.teacher,
    }));
  }
}
