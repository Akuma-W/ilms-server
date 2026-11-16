import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { EnrollmentStatus, Role } from 'src/generated/prisma/enums';
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

// Verifies that the acting user is an approved student, teacher or administrator of the class
@Injectable()
export class ClassMemberGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithClass>();
    const user = request.user;
    const classId =
      request.params.classId || request.params.id || request.body?.classId;

    if (!classId) {
      throw new BadRequestException('Class ID is required');
    }

    const targetClass = await this.prisma.class.findUnique({
      where: { id: classId },
      select: {
        id: true,
        teacherId: true,
        isArchived: true,
        schoolId: true,
      },
    });

    if (!targetClass) {
      throw new NotFoundException('Class not found');
    }

    if (user?.role === Role.admin || targetClass.teacherId === user?.id) {
      request.targetClass = targetClass;
      return true;
    }

    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        classId,
        userId: user?.id,
        status: EnrollmentStatus.approved,
      },
      select: { id: true, roleIn: true },
    });

    if (!enrollment) {
      throw new ForbiddenException(
        'You are not an active member of this class',
      );
    }

    request.targetClass = targetClass;
    return true;
  }
}
