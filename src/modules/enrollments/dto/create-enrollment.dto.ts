import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { EnrollmentStatus, Role } from 'src/generated/prisma/enums';

export class CreateEnrollmentDto {
  @ApiProperty({
    description: 'Id of user join class',
    type: 'string',
    example: 'a3f1c9b2-1234-4cde-9abc-1234567890ab',
  })
  @IsUUID()
  userId: string;

  @ApiProperty({
    description: 'ID of class',
    type: 'string',
    example: 'b2c1d9e8-5678-4abc-9def-0987654321ab',
  })
  @IsUUID()
  classId: string;

  @ApiProperty({
    description: 'Role in class',
    enum: Role,
    default: Role.student,
    example: 'student',
  })
  @IsEnum(Role)
  roleIn: Role;

  @ApiPropertyOptional({
    description: 'Mark the class with a star',
    type: 'boolean',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isStarred?: boolean;

  @ApiProperty({
    description: 'Status of enrollment',
    enum: EnrollmentStatus,
    default: EnrollmentStatus.pending,
  })
  @IsEnum(EnrollmentStatus)
  status: EnrollmentStatus = 'pending';
}
