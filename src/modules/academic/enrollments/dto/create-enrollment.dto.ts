import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { Role } from 'src/generated/prisma/enums';

export class CreateEnrollmentDto {
  @ApiPropertyOptional({
    description:
      'Id of user join class (defaults to authenticated user if omitted)',
    type: 'string',
    example: 'a3f1c9b2-1234-4cde-9abc-1234567890ab',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiProperty({
    description: 'ID of class',
    type: 'string',
    example: 'b2c1d9e8-5678-4abc-9def-0987654321ab',
  })
  @IsUUID()
  classId: string;

  @ApiPropertyOptional({
    description: 'Role in class (defaults to student)',
    type: 'string',
    example: Role.student,
    enum: Role,
    default: Role.student,
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
}
