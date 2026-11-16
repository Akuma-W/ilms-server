import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { AuthUser } from 'src/modules/auth/session/interfaces/auth-user.interface';

interface RequestWithClass {
  user?: AuthUser;
  params: Record<string, string>;
  body?: { classId?: string };
  targetClass?: {
    id: string;
    teacherId: string;
    isArchived: boolean;
    schoolId: string;
  };
}

// Blocks write mutations if the target class has been archived
@Injectable()
export class ClassNotArchivedGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithClass>();
    const classId =
      request.params.classId || request.params.id || request.body?.classId;

    if (!classId) {
      return true;
    }

    if (request.targetClass) {
      if (request.targetClass.isArchived) {
        throw new BadRequestException(
          'This class has been archived and is read-only',
        );
      }
      return true;
    }

    const targetClass = await this.prisma.class.findUnique({
      where: { id: classId },
      select: { isArchived: true },
    });

    if (!targetClass) {
      throw new NotFoundException('Class not found');
    }

    if (targetClass.isArchived) {
      throw new BadRequestException(
        'This class has been archived and is read-only',
      );
    }

    return true;
  }
}
