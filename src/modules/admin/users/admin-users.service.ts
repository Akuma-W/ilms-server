import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { StorageService } from 'src/infrastructures/storage/storage.service';
import { Role, UserStatus } from 'src/generated/prisma/enums';
import { Prisma } from 'src/generated/prisma/client';
import { PaginatedResult } from 'src/common/interfaces/paginated-result.interface';
import { NotificationFacade } from 'src/infrastructures/notification/notification.facade';
import { createAdminResetPasswordTemplate } from 'src/infrastructures/notification/email/templates/admin-reset-password.template';
import { AdminUserEntity } from './entities/admin-user.entity';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';
import { QueryAdminUsersDto } from './dto/query-admin-users.dto';
import { ResetPasswordAdminUserDto } from './dto/reset-password-admin-user.dto';
import { AdminActionResult } from '../interfaces/admin-action-result.interface';
import { generateSecurePassword } from '../utils/admin-password-generator.util';

export interface AdminResetPasswordResult extends AdminActionResult {
  temporaryPassword: string;
}

@Injectable()
export class AdminUsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly notificationFacade: NotificationFacade,
  ) {}

  // Creates a new user account with secure password hashing and unique email verification
  async create(dto: CreateAdminUserDto): Promise<AdminUserEntity> {
    const existingEmail = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (existingEmail) {
      throw new ConflictException('Email address already exists');
    }

    const clearPassword = dto.password || generateSecurePassword(12);
    const hashedPassword = await bcrypt.hash(clearPassword, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase().trim(),
        fullName: dto.fullName.trim(),
        password: hashedPassword,
        role: dto.role,
        schoolId: dto.schoolId,
        identityCode: dto.identityCode?.trim() || null,
        status: dto.status || UserStatus.active,
      },
      include: {
        school: {
          select: { id: true, name: true, shortname: true },
        },
      },
    });

    const avatarUrl = await this.storage.getAvatarUrl(user.avatarUrl);

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      identityCode: user.identityCode,
      role: user.role,
      status: user.status,
      avatarUrl,
      schoolId: user.schoolId,
      school: user.school,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  // Lists all user accounts with pagination, multi-criteria filtering and keyword search
  async findAll(
    query: QueryAdminUsersDto,
  ): Promise<PaginatedResult<AdminUserEntity>> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};

    if (query.role) {
      where.role = query.role;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.schoolId) {
      where.schoolId = query.schoolId;
    }

    if (query.search?.trim()) {
      const keyword = query.search.trim();
      where.OR = [
        { fullName: { contains: keyword, mode: 'insensitive' } },
        { email: { contains: keyword, mode: 'insensitive' } },
        { identityCode: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ createdAt: 'desc' }],
        include: {
          school: {
            select: { id: true, name: true, shortname: true },
          },
        },
      }),
    ]);

    const data: AdminUserEntity[] = await Promise.all(
      users.map(async (u) => {
        const avatarUrl = await this.storage.getAvatarUrl(u.avatarUrl);
        return {
          id: u.id,
          email: u.email,
          fullName: u.fullName,
          identityCode: u.identityCode,
          role: u.role,
          status: u.status,
          avatarUrl,
          schoolId: u.schoolId,
          school: u.school,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
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

  // Retrieves user account by UUID without revealing password hash
  async findOne(id: string): Promise<AdminUserEntity> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        school: {
          select: { id: true, name: true, shortname: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const avatarUrl = await this.storage.getAvatarUrl(user.avatarUrl);

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      identityCode: user.identityCode,
      role: user.role,
      status: user.status,
      avatarUrl,
      schoolId: user.schoolId,
      school: user.school,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  // Updates user account properties with strict self-lock protection for administrator
  async update(
    id: string,
    dto: UpdateAdminUserDto,
    currentAdminId: string,
  ): Promise<AdminUserEntity> {
    await this.findOne(id);

    if (id === currentAdminId) {
      if (dto.status && dto.status !== UserStatus.active) {
        throw new BadRequestException(
          'You cannot deactivate your own administrator account',
        );
      }
      if (dto.role && dto.role !== Role.admin) {
        throw new BadRequestException(
          'You cannot downgrade your own administrator role',
        );
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.fullName !== undefined && { fullName: dto.fullName.trim() }),
        ...(dto.role !== undefined && { role: dto.role }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.identityCode !== undefined && {
          identityCode: dto.identityCode.trim(),
        }),
        ...(dto.schoolId !== undefined && { schoolId: dto.schoolId }),
      },
      include: {
        school: {
          select: { id: true, name: true, shortname: true },
        },
      },
    });

    const avatarUrl = await this.storage.getAvatarUrl(updatedUser.avatarUrl);

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      fullName: updatedUser.fullName,
      identityCode: updatedUser.identityCode,
      role: updatedUser.role,
      status: updatedUser.status,
      avatarUrl,
      schoolId: updatedUser.schoolId,
      school: updatedUser.school,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    };
  }

  // Resets user password securely, emails temporary credential and returns it to administrator
  async resetPassword(
    id: string,
    dto: ResetPasswordAdminUserDto,
  ): Promise<AdminResetPasswordResult> {
    const user = await this.findOne(id);

    const clearPassword = dto.newPassword || generateSecurePassword(12);
    const hashedPassword = await bcrypt.hash(clearPassword, 10);

    await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    const emailTemplate = createAdminResetPasswordTemplate(clearPassword, 'vi');
    await this.notificationFacade.sendEmailTemplate(user.email, emailTemplate);

    return {
      success: true,
      message: 'Password reset successfully',
      temporaryPassword: clearPassword,
    };
  }

  // Soft-deletes user account by setting status to banned preventing self-deletion
  async remove(id: string, currentAdminId: string): Promise<AdminActionResult> {
    await this.findOne(id);

    if (id === currentAdminId) {
      throw new BadRequestException(
        'You cannot delete your own administrator account',
      );
    }

    await this.prisma.user.update({
      where: { id },
      data: { status: UserStatus.banned },
    });

    return {
      success: true,
      message: 'User account deactivated successfully',
    };
  }
}
