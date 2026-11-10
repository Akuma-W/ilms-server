import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { QueryDto } from 'src/common/dto/query.dto';
import { EnrollmentStatus, Role } from 'src/generated/prisma/enums';

export class QueryMemberDto extends QueryDto {
  @ApiPropertyOptional({
    description: 'Filter by member role',
    type: 'string',
    enum: Role,
    example: Role.student,
  })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({
    description: 'Filter by enrollment status',
    type: 'string',
    enum: EnrollmentStatus,
    example: EnrollmentStatus.approved,
  })
  @IsOptional()
  @IsEnum(EnrollmentStatus)
  status?: EnrollmentStatus;
}
