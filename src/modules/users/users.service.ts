import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateGoogleUserDto } from './dto/create-google-user.dto';
import { UserEntity } from './entities/user.entity';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { StorageService } from 'src/infrastructures/storage/storage.service';
import { UserStatus } from 'src/generated/prisma/enums';
import { UserAuthCredentials } from './interfaces/user-auth.interface';
import { USER_SELECT } from './constants/user-select.constant';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  // Creates user authenticated and registered via registration flow
  async createRegisteredUser(
    createUserDto: CreateUserDto,
  ): Promise<UserEntity> {
    const user = await this.prisma.user.create({
      data: {
        ...createUserDto,
        status: createUserDto.status ?? UserStatus.active,
      },
      select: USER_SELECT,
    });

    const avatarUrl = await this.storage.getAvatarUrl(user.avatarUrl);

    return { ...user, avatarUrl };
  }

  // Creates user authenticated via Google OAuth
  async createGoogleUser(dto: CreateGoogleUserDto): Promise<UserEntity> {
    const user = await this.prisma.user.create({
      data: dto,
      select: USER_SELECT,
    });

    const avatarUrl = await this.storage.getAvatarUrl(user.avatarUrl);

    return { ...user, avatarUrl };
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

    const avatarUrl = await this.storage.getAvatarUrl(user.avatarUrl);

    return { ...user, avatarUrl };
  }

  // Retrieves user by email with authentication credentials
  async findByEmail(email: string): Promise<UserAuthCredentials | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        ...USER_SELECT,
        password: true,
        googleId: true,
      },
    });

    if (!user) {
      return null;
    }

    const avatarUrl = await this.storage.getAvatarUrl(user.avatarUrl);

    return { ...user, avatarUrl };
  }

  // Updates user password hash directly for authentication services
  async updatePassword(id: string, hashedPassword: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword,
        mustChangePassword: false,
      },
    });
  }

  // Updates linked Google OAuth credentials for user account
  async updateGoogleAccount(
    id: string,
    data: { googleId?: string; avatarUrl?: string },
  ): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data,
    });
  }

  // Updates user registered profile for OAuth onboarding
  async updateRegisteredUser(
    id: string,
    payload: Partial<CreateUserDto>,
  ): Promise<UserEntity> {
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: payload,
      select: USER_SELECT,
    });

    const avatarUrl = await this.storage.getAvatarUrl(updatedUser.avatarUrl);

    return { ...updatedUser, avatarUrl };
  }
}
