import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { Role } from 'src/generated/prisma/enums';
import { Prisma } from 'src/generated/prisma/client';
import { PaginatedResult } from 'src/common/interfaces/paginated-result.interface';
import { AdminSchoolEntity } from './entities/admin-school.entity';
import { CreateAdminSchoolDto } from './dto/create-admin-school.dto';
import { UpdateAdminSchoolDto } from './dto/update-admin-school.dto';
import { QueryAdminSchoolsDto } from './dto/query-admin-schools.dto';
import { AdminActionResult } from '../interfaces/admin-action-result.interface';

@Injectable()
export class AdminSchoolsService {
  constructor(private readonly prisma: PrismaService) {}

  // Creates a new institutional school entry with duplicate code verification
  async create(dto: CreateAdminSchoolDto): Promise<AdminSchoolEntity> {
    if (dto.shortname) {
      const existing = await this.prisma.school.findUnique({
        where: { shortname: dto.shortname },
      });
      if (existing) {
        throw new ConflictException(
          'School shortname already exists in system',
        );
      }
    }

    const school = await this.prisma.school.create({
      data: {
        name: dto.name,
        shortname: dto.shortname,
        address: dto.address,
        city: dto.city,
        ...(dto.status && { status: dto.status }),
      },
    });

    return {
      ...school,
      totalStudents: 0,
      totalTeachers: 0,
      totalClasses: 0,
      totalSubjects: 0,
    };
  }

  // Lists all schools with dynamic filtering, search and aggregated metrics
  async findAll(
    query: QueryAdminSchoolsDto,
  ): Promise<PaginatedResult<AdminSchoolEntity>> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const where: Prisma.SchoolWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.search?.trim()) {
      const keyword = query.search.trim();
      where.OR = [
        { name: { contains: keyword, mode: 'insensitive' } },
        { shortname: { contains: keyword, mode: 'insensitive' } },
        { city: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    const [total, schools] = await Promise.all([
      this.prisma.school.count({ where }),
      this.prisma.school.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ status: 'asc' }, { name: 'asc' }],
        include: {
          _count: {
            select: {
              classes: true,
              subjects: true,
              users: true,
            },
          },
        },
      }),
    ]);

    const data: AdminSchoolEntity[] = await Promise.all(
      schools.map(async (school) => {
        const [studentCount, teacherCount] = await Promise.all([
          this.prisma.user.count({
            where: { schoolId: school.id, role: Role.student },
          }),
          this.prisma.user.count({
            where: { schoolId: school.id, role: Role.teacher },
          }),
        ]);

        return {
          id: school.id,
          name: school.name,
          shortname: school.shortname,
          address: school.address,
          city: school.city,
          status: school.status,
          totalStudents: studentCount,
          totalTeachers: teacherCount,
          totalClasses: school._count.classes,
          totalSubjects: school._count.subjects,
          createdAt: school.createdAt,
          updatedAt: school.updatedAt,
        };
      }),
    );

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

  // Retrieves institutional profile by UUID identifier
  async findOne(id: string): Promise<AdminSchoolEntity> {
    const school = await this.prisma.school.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            classes: true,
            subjects: true,
            users: true,
          },
        },
      },
    });

    if (!school) {
      throw new NotFoundException('School not found');
    }

    const [studentCount, teacherCount] = await Promise.all([
      this.prisma.user.count({
        where: { schoolId: school.id, role: Role.student },
      }),
      this.prisma.user.count({
        where: { schoolId: school.id, role: Role.teacher },
      }),
    ]);

    return {
      id: school.id,
      name: school.name,
      shortname: school.shortname,
      address: school.address,
      city: school.city,
      status: school.status,
      totalStudents: studentCount,
      totalTeachers: teacherCount,
      totalClasses: school._count.classes,
      totalSubjects: school._count.subjects,
      createdAt: school.createdAt,
      updatedAt: school.updatedAt,
    };
  }

  // Updates school attributes or transitions operational status
  async update(
    id: string,
    dto: UpdateAdminSchoolDto,
  ): Promise<AdminSchoolEntity> {
    await this.findOne(id);

    if (dto.shortname) {
      const existing = await this.prisma.school.findFirst({
        where: { shortname: dto.shortname, id: { not: id } },
      });
      if (existing) {
        throw new ConflictException(
          'School shortname already in use by another institution',
        );
      }
    }

    await this.prisma.school.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.shortname !== undefined && { shortname: dto.shortname }),
        ...(dto.address !== undefined && { address: dto.address }),
        ...(dto.city !== undefined && { city: dto.city }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
    });

    return this.findOne(id);
  }

  // Deletes school only when unlinked to any classes or user accounts
  async remove(id: string): Promise<AdminActionResult> {
    const school = await this.prisma.school.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            classes: true,
            users: true,
            subjects: true,
          },
        },
      },
    });

    if (!school) {
      throw new NotFoundException('School not found');
    }

    if (school._count.classes > 0 || school._count.users > 0) {
      throw new BadRequestException(
        'Cannot delete a school that still has linked members or classes. Please deactivate it instead.',
      );
    }

    await this.prisma.school.delete({ where: { id } });

    return {
      success: true,
      message: 'School has been deleted successfully',
    };
  }
}
