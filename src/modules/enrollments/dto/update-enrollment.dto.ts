import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { Role, EnrollmentStatus } from 'src/generated/prisma/enums';

export class UpdateEnrollmentDto {
  @ApiPropertyOptional({
    description: 'Role in class',
    type: 'string',
    enum: Role,
    default: Role.student,
    example: Role.student,
  })
  @IsOptional()
  @IsEnum(Role)
  roleIn?: Role;

  @ApiPropertyOptional({
    description: 'Mark the class with a star',
    type: 'boolean',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isStarred?: boolean;

  @ApiPropertyOptional({
    description: 'Status of enrollment',
    type: 'string',
    example: EnrollmentStatus.pending,
    enum: EnrollmentStatus,
    default: EnrollmentStatus.pending,
  })
  @IsOptional()
  @IsEnum(EnrollmentStatus)
  status: EnrollmentStatus = 'pending';
}
