import { IsUUID, IsEmail, IsString, IsEnum, IsOptional } from 'class-validator';
import { School } from 'src/generated/prisma/client';
import { Role, UserStatus } from 'src/generated/prisma/enums';

export class UserResponseDto {
  @IsUUID()
  id: string;

  @IsEmail()
  email: string;

  @IsString()
  fullName: string;

  @IsEnum(Role)
  role: Role;

  @IsUUID()
  schoolId: string;

  @IsOptional()
  @IsString()
  avatarUrl: string | null;

  @IsOptional()
  @IsString()
  identityCode: string | null;

  @IsEnum(UserStatus)
  status: UserStatus | null;

  school: School;
}
