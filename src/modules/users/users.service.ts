import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { hashPassword } from 'src/common/utils/hash.util';
import { validateAvatar } from 'src/common/utils/file-validation.util';
import { StorageService } from 'src/infrastructures/storage/storage.service';
import { StorageFolder } from 'src/common/constants/storage-folders.constant';
import { LoggerService } from 'src/logger/logger.service';
import { CreateGoogleUserDto } from './dto/create-google-user.dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
    private logger: LoggerService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    this.logger.log(`POST: /user - Creating user`);

    // Check if user with the same email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Check password
    if (!createUserDto.password) {
      throw new UnauthorizedException('Password not found');
    }

    // Hash password
    const hashedPassword = await hashPassword(createUserDto.password);

    const user = await this.prisma.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
      },
      select: this.userSelect,
    });

    return user;
  }

  async createGoogleUser(dto: CreateGoogleUserDto) {
    return this.prisma.user.create({
      data: dto,
      select: this.userSelect,
    });
  }

  async findAll() {
    const users = await this.prisma.user.findMany({
      select: this.userSelect,
    });

    return users;
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id },
      select: this.userSelect,
    });

    return user;
  }

  async findByEmail(email: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { email },
      select: {
        ...this.userSelect,
        password: true,
      },
    });

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.findOne(id);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      select: this.userSelect,
    });

    return updatedUser;
  }

  async remove(id: string) {
    const user = await this.findOne(id);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    return this.prisma.user.delete({
      where: { id },
      select: this.userSelect,
    });
  }

  async updateAvatar(userId: string, file: Express.Multer.File) {
    // Check file valid (images)
    validateAvatar(file);

    // Find current user
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });

    // Check if avatar existed
    const avatarPath = await this.storage.upload(file, StorageFolder.AVATARS);
    const avatarUrl = this.storage.getUrl(avatarPath);

    if (user.avatarUrl) {
      try {
        await this.storage.delete(user.avatarUrl);
      } catch (error: unknown) {
        this.logger.error('Failed to delete old avatar', {
          error,
        });
      }
    }

    // Update avatar
    await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
    });

    return {
      message: 'Cập nhật avatar thành công',
      data: {
        avatarUrl,
      },
    };
  }

  /** HELPER: user select */
  private userSelect = {
    id: true,
    email: true,
    identityCode: true,
    fullName: true,
    role: true,
    avatarUrl: true,
    schoolId: true,
    status: true,
    createdAt: true,
    school: {
      select: {
        name: true,
      },
    },
  };
}
