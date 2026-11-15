import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { AuthUser } from 'src/modules/auth/session/interfaces/auth-user.interface';
import { checkTeacherPermission } from 'src/modules/academic/utils/academic-permission.util';

@Injectable()
export class ClassTeacherGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as AuthUser | undefined;

    if (!user) {
      return false;
    }

    const classId =
      (request.params.classId as string) || (request.params.id as string);

    if (!classId) {
      return true;
    }

    await checkTeacherPermission(this.prisma, user.id, classId, user.role);

    return true;
  }
}
