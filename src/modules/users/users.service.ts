import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { hashPassword } from 'src/common/utils/hash.util';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    this.logger.log(`POST: /user - Creating user`);

    // Check if user with the same email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
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
}
