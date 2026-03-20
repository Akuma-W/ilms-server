import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { Role, EnrollmentStatus } from 'src/generated/prisma/enums';

export class UpdateEnrollmentDto {
  @ApiPropertyOptional({
    description: 'Role in class',
    enum: Role,
    default: Role.student,
    example: 'student',
  })
  @IsOptional()
  @IsEnum(Role)
  roleIn?: Role;

  @ApiPropertyOptional({
    description: 'Mark the class with a star',
    type: 'boolean',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isStarred?: boolean;

  @ApiPropertyOptional({
    description: 'Status of enrollment',
    enum: EnrollmentStatus,
    default: EnrollmentStatus.pending,
  })
  @IsOptional()
  @IsEnum(EnrollmentStatus)
  status: EnrollmentStatus = 'pending';
}
