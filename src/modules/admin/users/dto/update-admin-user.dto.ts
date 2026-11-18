import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { Role, UserStatus } from 'src/generated/prisma/enums';

export class UpdateAdminUserDto {
  @ApiPropertyOptional({
    description: 'Full legal name',
    example: 'Trần Thị Mai',
    type: 'string',
  })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({
    description: 'System role',
    example: Role.teacher,
    enum: Role,
    type: 'string',
  })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({
    description: 'Account operational status',
    example: UserStatus.locked,
    enum: UserStatus,
    type: 'string',
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({
    description: 'Student or teacher identity code',
    example: 'GV2026001',
    type: 'string',
  })
  @IsOptional()
  @IsString()
  identityCode?: string;

  @ApiPropertyOptional({
    description: 'Affiliated school UUID identifier',
    example: 'a0000000-0000-0000-0000-000000000001',
    type: 'string',
  })
  @IsOptional()
  @IsUUID('4')
  schoolId?: string;
}
