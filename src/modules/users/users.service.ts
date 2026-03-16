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
import { User } from './entities/user.entity';
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
    });

    return new User(user);
  }

  async createGoogleUser(dto: CreateGoogleUserDto) {
    return this.prisma.user.create({ data: dto });
  }

  async findAll() {
    const users = await this.prisma.user.findMany();

    return users.map((user) => new User(user));
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id },
    });

    return new User(user);
  }

  async findByEmail(email: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { email },
    });

    return new User(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.findOne(id);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });

    return new User(updatedUser);
  }

  async remove(id: string) {
    const user = await this.findOne(id);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    return this.prisma.user.delete({
      where: { id },
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
      data: { avatarUrl: avatarPath },
    });

    return {
      message: 'Cập nhật avatar thành công',
      data: {
        avatarUrl: this.storage.getUrl(avatarPath),
      },
    };
  }
}
