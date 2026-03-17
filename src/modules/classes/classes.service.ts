import {
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

@Injectable()
export class ClassesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: AuthUser, createClassDto: CreateClassDto) {
    if (user.role !== Role.teacher) {
      throw new ForbiddenException('Only teacher can create class');
    }

    const findUser = await this.prisma.user.findUnique({
      where: { id: user.id },
    });

    const courseCode = this.generateCourseCode();

    return 'This action adds a new class';
  }

  async findAll(userId: string, queryClassDto: QueryClassDto) {
    const user = await this.getCurrentUser(userId);
    const { keyword, page, limit } = queryClassDto;

    const skip = (page - 1) * limit;
    const take = limit;

    const baseWhere: any = {
      schoolId: user?.schoolId,
      deleteAt: null, // for soft delete
    };

    const where: any = { ...baseWhere };

    // ADMIN: Find all
    if (user.role === Role.admin) {
      if (keyword) {
        where.OR = this.buildKeywordCondition(keyword);
      }
    }

    // TEACHER / STUDENT: Find public class

    if (courseCode) {
      where.courseCode = courseCode;
    } else if (keyword) {
      where.isPrivate = false;
      where.OR = [
        {
          title: {
            contains: keyword,
            mode: 'insensitive',
          },
        },
        {
          teacher: {
            fullName: {
              contains: keyword,
              mode: 'insensitive',
            },
          },
        },
      ];
    } else {
      where.isPrivate = false;
    }

    const [data, total] = await Promise.all([
      this.prisma.class.findMany({
        where,
        skip,
        take,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          title: true,
          subject: true,
          description: true,
          semester: true,
          courseCode: true,
          isPrivate: true,
          createdAt: true,
          teacher: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
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

  async findOne(userPayload: { id: string; role: Role }, classId: string) {
    const user = await this.getCurrentUser(userPayload.id);

    const found = await this.prisma.class.findFirst({
      where: {
        id: classId,
        schoolId: user.schoolId,
        // deletedAt: null,
      },
      select: this.classSelect(),
    });

    if (!found) {
      throw new NotFoundException('Class not found');
    }

    // private class check
    if (found.isPrivate && user.role !== Role.admin) {
      throw new ForbiddenException('Cannot access private class');
    }

    return found;
  }

  update(id: number, updateClassDto: UpdateClassDto) {
    return `This action updates a #${id} class`;
  }

  remove(id: number) {
    return `This action removes a #${id} class`;
  }

  // HELPERS: generate course code
  private generateCourseCode(): string {
    const code = randomBytes(4)
      .toString('base64') // encode
      .replace(/[^A-Z0-9]/gi, '') // remove strange character
      .toUpperCase()
      .slice(0, 6); // 6 digit
    return code;
  }

  // Get data from current user
  private async getCurrentUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        schoolId: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  private buildKeywordCondition(keyword: string) {
    return [
      {
        title: {
          contains: keyword,
          mode: 'insensitive',
        },
      },
      {
        teacher: {
          fullName: {
            contains: keyword,
            mode: 'insensitive',
          },
        },
      },
    ];
  }

  private classSelect() {
    return {
      id: true,
      title: true,
      subject: true,
      description: true,
      semester: true,
      courseCode: true,
      isPrivate: true,
      createdAt: true,
      teacher: {
        select: {
          id: true,
          fullName: true,
        },
      },
    };
  }
}
