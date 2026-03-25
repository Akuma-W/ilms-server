import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { comparePasword, hashPassword } from 'src/common/utils/hash.util';
import { Role, UserStatus } from 'src/generated/prisma/enums';
import { UsersService } from 'src/modules/users/users.service';
import { AuthUser } from '../interfaces/auth-user.interface';
import { TokenService } from './token.service';
import { RegisterDto } from '../dto/register.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly tokenService: TokenService,
  ) {}

  // Register
  async register(dto: RegisterDto) {
    const { email, password, role, identityCode } = dto;

    // Check if existed
    const existed = await this.usersService.findByEmail(email);
    if (existed) {
      throw new ConflictException('Email already exists');
    }

    // Check if user is student, identityCode will be required
    this.validateIdentity(role, identityCode);

    // Hash password
    const hashedPassword = await hashPassword(password);

    const user = await this.usersService.create({
      ...dto,
      password: hashedPassword,
      status: UserStatus.active,
    });

    return { userId: user.id };
  }

  // Login by email, password
  async login(user: AuthUser) {
    // Create token
    const tokens = await this.tokenService.generateTokens(user.id, user.role);

    return {
      userId: user.id,
      ...tokens,
    };
  }

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);

    // Check if user exists
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if users is active
    if (user.status === UserStatus.locked) {
      throw new UnauthorizedException('User is locked');
    }

    if (user.status === UserStatus.banned) {
      throw new UnauthorizedException('User is banned');
    }

    // Check password
    if (!user.password) {
      throw new UnauthorizedException('Password not found');
    }

    const isMatch = await comparePasword(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  validateIdentity(role: Role, identityCode?: string) {
    if (role === 'student' && !identityCode) {
      throw new BadRequestException('identityCode is required for student');
    }
  }
}
