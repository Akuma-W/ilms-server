import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { Role, UserStatus } from 'src/generated/prisma/enums';
import { Prisma } from 'src/generated/prisma/client';
import { SchoolEntity } from './entities/school.entity';

@Injectable()
export class SchoolsService {
  constructor(private readonly prisma: PrismaService) {}

  // Lists all schools registered in system
  async findAll(): Promise<SchoolEntity[]> {
    return this.prisma.school.findMany({
      orderBy: { name: 'asc' },
    });
  }

  // Retrieves school by unique id
  async findOne(id: string): Promise<SchoolEntity | null> {
    return this.prisma.school.findUnique({
      where: { id },
    });
  }

  // Finds active teachers in a specific school for assistant assignment
  async findSchoolTeachers(currentUserId: string, search?: string) {
    const currentUser = await this.prisma.user.findUnique({
      where: { id: currentUserId },
      select: { schoolId: true },
    });

    if (!currentUser?.schoolId) {
      return [];
    }

    const where: Prisma.UserWhereInput = {
      schoolId: currentUser.schoolId,
      role: Role.teacher,
      status: UserStatus.active,
      id: { not: currentUserId },
    };

    if (search && search.trim()) {
      const keyword = search.trim();
      where.OR = [
        { fullName: { contains: keyword, mode: 'insensitive' } },
        { email: { contains: keyword, mode: 'insensitive' } },
        { identityCode: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        email: true,
        avatarUrl: true,
      },
      orderBy: { fullName: 'asc' },
      take: 20,
    });
  }
}
