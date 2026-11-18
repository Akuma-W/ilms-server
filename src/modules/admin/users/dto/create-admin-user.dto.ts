import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';
import { Role, UserStatus } from 'src/generated/prisma/enums';

export class CreateAdminUserDto {
  @ApiProperty({
    description: 'User primary email',
    example: 'newuser@school.edu.vn',
    type: 'string',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    description: 'Full legal name',
    example: 'Trần Thị Mai',
    type: 'string',
  })
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @ApiPropertyOptional({
    description:
      'Initial password (min 8 chars); if omitted, an unpredictable secure password is generated',
    example: 'SecurePass@123',
    type: 'string',
  })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @ApiProperty({
    description: 'Role assigned: student | teacher | admin',
    example: Role.student,
    enum: Role,
    type: 'string',
  })
  @IsEnum(Role)
  role!: Role;

  @ApiProperty({
    description: 'Affiliated school UUID',
    example: 'a0000000-0000-0000-0000-000000000001',
    type: 'string',
  })
  @IsUUID('4')
  schoolId!: string;

  @ApiPropertyOptional({
    description: 'Identity code (student/teacher ID)',
    example: 'SV2026045',
    type: 'string',
  })
  @IsOptional()
  @IsString()
  identityCode?: string;

  @ApiPropertyOptional({
    description: 'Initial account status',
    example: UserStatus.active,
    enum: UserStatus,
    type: 'string',
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}
