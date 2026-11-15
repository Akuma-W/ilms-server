import { IsEmail, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { Role, UserStatus } from 'src/generated/prisma/enums';
import { SchoolEntity } from 'src/modules/academic/schools/entities/school.entity';

export class UserEntity {
  @IsUUID()
  id!: string;

  @IsEmail()
  email!: string;

  @IsString()
  fullName!: string;

  @IsEnum(Role)
  role!: Role;

  @IsUUID()
  schoolId!: string;

  @IsOptional()
  @IsString()
  avatarUrl!: string | null;

  @IsOptional()
  @IsString()
  avatar!: string | null;

  @IsOptional()
  @IsString()
  identityCode!: string | null;

  @IsEnum(UserStatus)
  status!: UserStatus;

  @IsOptional()
  createdAt!: Date | null;

  @IsOptional()
  school?: SchoolEntity | null;
}
