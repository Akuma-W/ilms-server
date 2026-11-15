import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserEntity } from '../entities/user.entity';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { StorageService } from 'src/infrastructures/storage/storage.service';
import { UserStatus } from 'src/generated/prisma/enums';
import { USER_SELECT } from '../constants/user-select.constant';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  // Creates new user record initiated by administrator
  async createAdminUser(createUserDto: CreateUserDto): Promise<UserEntity> {
    const user = await this.prisma.user.create({
      data: createUserDto,
      select: USER_SELECT,
    });

    const avatar = await this.storage.getAvatarUrl(user.avatarUrl);

    return { ...user, avatar };
  }

  // Lists all users across system
  async findAll(): Promise<UserEntity[]> {
    const users = await this.prisma.user.findMany({
      select: USER_SELECT,
    });

    return Promise.all(
      users.map(async (user) => {
        const avatar = await this.storage.getAvatarUrl(user.avatarUrl);

        return { ...user, avatar };
      }),
    );
  }

  // Retrieves user by primary key id
  async findOne(id: string): Promise<UserEntity> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: USER_SELECT,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const avatar = await this.storage.getAvatarUrl(user.avatarUrl);

    return { ...user, avatar };
  }

  // Updates user account properties by administrator
  async updateAdminUser(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserEntity> {
    await this.findOne(id);

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      select: USER_SELECT,
    });

    const avatar = await this.storage.getAvatarUrl(updatedUser.avatarUrl);

    return { ...updatedUser, avatar };
  }

  // Deactivates user account (soft delete) by setting status to banned
  async delete(id: string): Promise<UserEntity> {
    await this.findOne(id);

    const deactivatedUser = await this.prisma.user.update({
      where: { id },
      data: { status: UserStatus.banned },
      select: USER_SELECT,
    });

    const avatar = await this.storage.getAvatarUrl(deactivatedUser.avatarUrl);

    return { ...deactivatedUser, avatar };
  }
}
