import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { QueryDto } from 'src/common/dto/query.dto';
import { Role, UserStatus } from 'src/generated/prisma/enums';

export class QueryAdminUsersDto extends QueryDto {
  @ApiPropertyOptional({
    description: 'Filter users by assigned role: student | teacher | admin',
    example: Role.student,
    enum: Role,
    type: 'string',
  })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({
    description: 'Filter users by operational status: active | locked | banned',
    example: UserStatus.active,
    enum: UserStatus,
    type: 'string',
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({
    description: 'Filter users by affiliated school UUID',
    example: 'a0000000-0000-0000-0000-000000000001',
    type: 'string',
  })
  @IsOptional()
  @IsUUID('4')
  schoolId?: string;
}
