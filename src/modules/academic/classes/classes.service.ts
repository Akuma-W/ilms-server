import {
  BadRequestException,
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
import { ClassEntity } from './entities/class.entity';
import { PaginatedResult } from 'src/common/interfaces/paginated-result.interface';
import { generateUniqueCourseCode } from './utils/course-code.util';
import {
  classDetailInclude,
  getClassListInclude,
} from './utils/class-include.util';
import {
  mapToClassDetailItem,
  mapToClassListItem,
  resolveClassTeacherAvatar,
} from './utils/class-mapper.util';
import {
  buildClassListWhere,
  buildTeachingClassesWhere,
} from './utils/class-query.util';
import { enrollClassAssistants } from './utils/class-assistant.util';
import { findClassWithPermission } from './utils/class-permission.util';
import { executeClassCascadeDelete } from './utils/class-delete.util';
import { StorageService } from 'src/infrastructures/storage/storage.service';

type PaginatedClassesResult = PaginatedResult<
  ClassEntity & { totalStudents: number; enrollment: unknown }
>;

@Injectable()
export class ClassesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly storage: StorageService,
  ) {}

  // Creates a new class and automatically enrolls the teacher as approved owner
  async create(
    schoolId: string,
    teacherId: string,
    createClassDto: CreateClassDto,
  ): Promise<ClassEntity> {
    const { assistantIds, subjectId, ...classPayload } = createClassDto;

    const subjectRecord = await this.prisma.subject.findUnique({
      where: { id: subjectId },
      select: { id: true, name: true, schoolId: true, isActive: true },
    });
    if (!subjectRecord || subjectRecord.schoolId !== schoolId) {
      throw new BadRequestException(
        'Subject not found or does not belong to this school',
      );
    }

    const courseCode = await generateUniqueCourseCode(this.prisma);

    const classroom = await this.prisma.class.create({
      data: {
        ...classPayload,
        subjectId,
        maxStudents: classPayload.maxStudents ?? 60,
        totalStudents: 0,
        courseCode,
        schoolId,
        teacherId,
      },
      include: {
        subjectRef: true,
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

    await enrollClassAssistants(
      this.prisma,
      classroom.id,
      schoolId,
      teacherId,
      assistantIds,
    );

    return classroom as ClassEntity;
  }

  // Creates a class on behalf of a teacher
  async createByTeacher(
    userId: string,
    createClassDto: CreateClassDto,
  ): Promise<ClassEntity> {
    const { schoolId } = await this.usersService.findOne(userId);

    return this.create(schoolId, userId, createClassDto);
  }

  // Find all public classes in user's school excluding archived ones by default
  async findAll(
    userId: string,
    queryClassDto: QueryClassDto,
  ): Promise<PaginatedClassesResult> {
    const user = await this.usersService.findOne(userId);
    const { search, page, limit, isArchived, subjectId } = queryClassDto;

    const skip = (page - 1) * limit;
    const take = limit;

    const where = buildClassListWhere(
      user.schoolId,
      search,
      isArchived,
      subjectId,
    );

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

    const resolved = await Promise.all(
      result.map((item) => resolveClassTeacherAvatar(this.storage, item)),
    );
    const data = resolved.map(mapToClassListItem);

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

    const resolved = await resolveClassTeacherAvatar(this.storage, classroom);
    return mapToClassDetailItem(resolved);
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

    const resolved = await resolveClassTeacherAvatar(this.storage, classroom);
    return mapToClassDetailItem(resolved);
  }

  // Find all classes created by currently authenticated teacher
  async findMyTeachingClasses(
    userId: string,
    query: QueryClassDto,
  ): Promise<PaginatedClassesResult> {
    const { search: keyword, page, limit, isArchived, subjectId } = query;

    const skip = (page - 1) * limit;
    const take = limit;

    const where = buildTeachingClassesWhere(
      userId,
      keyword,
      isArchived,
      subjectId,
    );

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

    const resolved = await Promise.all(
      result.map((item) => resolveClassTeacherAvatar(this.storage, item)),
    );
    const data = resolved.map(mapToClassListItem);

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
    const existing = await findClassWithPermission(
      this.prisma,
      user,
      classId,
      'update',
    );

    const { subjectId, ...updatePayload } = updateClassDto;
    delete updatePayload.assistantIds;

    const dataToUpdate: Prisma.ClassUpdateInput = {
      ...updatePayload,
    };

    if (subjectId !== undefined) {
      if (!subjectId) {
        throw new BadRequestException('Subject is required');
      }
      const subjectRecord = await this.prisma.subject.findUnique({
        where: { id: subjectId },
        select: { id: true, name: true, schoolId: true },
      });
      if (!subjectRecord || subjectRecord.schoolId !== existing.schoolId) {
        throw new BadRequestException(
          'Subject not found or does not belong to this school',
        );
      }
      dataToUpdate.subjectRef = { connect: { id: subjectId } };
    }

    await this.prisma.class.update({
      where: { id: classId },
      data: dataToUpdate,
    });

    return { message: 'Class updated successfully' };
  }

  // Archives a class and sets it into read-only mode
  async archiveClass(
    user: AuthUser,
    classId: string,
  ): Promise<{ message: string }> {
    const existing = await findClassWithPermission(
      this.prisma,
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

    return { message: 'Class archived successfully' };
  }

  // Unarchives a class and restores mutation privileges
  async unarchiveClass(
    user: AuthUser,
    classId: string,
  ): Promise<{ message: string }> {
    const existing = await findClassWithPermission(
      this.prisma,
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

    return { message: 'Class unarchived successfully' };
  }

  // Hard deletes class and cascades all dependent relations in a transaction
  async remove(user: AuthUser, classId: string): Promise<{ message: string }> {
    await findClassWithPermission(this.prisma, user, classId, 'delete');

    await executeClassCascadeDelete(this.prisma, classId);

    return { message: 'Class deleted successfully' };
  }
}
