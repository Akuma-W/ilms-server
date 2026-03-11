import { Exclude } from 'class-transformer';
import { IsEmail, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { Role, UserStatus } from 'src/generated/prisma/enums';

export class User {
  @IsUUID()
  id: string;

  @IsEmail()
  email: string;

  @Exclude()
  @IsString()
  password: string;

  @IsString()
  fullName: string;

  @IsEnum(Role)
  role: Role;

  @IsUUID()
  schoolId: string;

  @IsOptional()
  @IsString()
  googleId: string | null;

  @IsOptional()
  @IsString()
  avatarUrl: string | null;

  @IsOptional()
  @IsString()
  identityCode: string | null;

  @IsEnum(UserStatus)
  status: UserStatus | null;

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
  }
}
