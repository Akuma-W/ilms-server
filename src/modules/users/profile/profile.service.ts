import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { StorageService } from 'src/infrastructures/storage/storage.service';
import { StorageFolder } from 'src/common/constants/storage-folders.constant';
import { validateAvatar } from 'src/common/utils/file-validation.util';
import { EnrollmentStatus, Role } from 'src/generated/prisma/enums';
import { USER_SELECT } from '../constants/user-select.constant';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileClassEntity } from './entities/profile-class.entity';
import { UserEntity } from 'src/modules/users/entities/user.entity';
import {
  mapStudentEnrollmentsToProfileClasses,
  mapTeacherClassesToProfileClasses,
} from './utils/profile-class-mapper.util';
import { PROFILE_CLASS_INCLUDE } from './utils/profile-class-query.constant';

@Injectable()
export class ProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  // Retrieves authenticated user personal profile
  async getProfile(userId: string): Promise<UserEntity> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: USER_SELECT,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const avatarUrl = await this.storage.getAvatarUrl(user.avatarUrl);

    return { ...user, avatarUrl };
  }

  // Retrieves enrolled or taught classes for profile learning progress
  async getProfileClasses(
    userId: string,
    role: Role,
  ): Promise<ProfileClassEntity[]> {
    if (role === Role.student) {
      const enrollments = await this.prisma.enrollment.findMany({
        where: {
          userId,
          status: EnrollmentStatus.approved,
        },
        include: {
          class: {
            include: PROFILE_CLASS_INCLUDE,
          },
        },
        orderBy: { joinedAt: 'desc' },
      });

      return mapStudentEnrollmentsToProfileClasses(enrollments);
    }

    const classes = await this.prisma.class.findMany({
      where: {
        teacherId: userId,
      },
      include: PROFILE_CLASS_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });

    return mapTeacherClassesToProfileClasses(classes);
  }

  // Updates self profile attributes
  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<{ message: string; data: UserEntity }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.fullName ? { fullName: dto.fullName.trim() } : {}),
        ...(dto.identityCode !== undefined
          ? { identityCode: dto.identityCode?.trim() || null }
          : {}),
      },
      select: USER_SELECT,
    });

    const avatarUrl = await this.storage.getAvatarUrl(updatedUser.avatarUrl);

    return {
      message: 'Profile updated successfully',
      data: { ...updatedUser, avatarUrl },
    };
  }

  // Uploads and updates user avatar using storage replaceFile utility
  async updateAvatar(
    userId: string,
    file: Express.Multer.File,
  ): Promise<{ message: string; data: { avatarUrl: string | null } }> {
    validateAvatar(file);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const avatarPath = await this.storage.replaceFile(
      user.avatarUrl,
      file,
      StorageFolder.AVATARS,
    );

    await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: avatarPath },
    });

    const avatarUrl = await this.storage.getUrl(avatarPath);

    return {
      message: 'Avatar updated successfully',
      data: {
        avatarUrl,
      },
    };
  }
}
