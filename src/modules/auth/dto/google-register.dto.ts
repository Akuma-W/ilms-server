import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { Role } from 'src/generated/prisma/enums';

export class GoogleRegisterDto {
  @ApiPropertyOptional({
    description: 'Google user full name',
    type: 'string',
    example: 'Nguyen Van A',
  })
  @IsString()
  fullName?: string;

  @ApiProperty({
    description: 'User role: student | teacher | admin',
    type: 'string',
    example: Role.student,
    enum: Role,
    default: Role.student,
  })
  @IsEnum(Role)
  role: Role;

  @ApiProperty({
    description: 'Id of user school',
    type: 'string',
    example: '133c7575-1b40-4ba3-9a24-9484964b9a24',
  })
  @IsUUID()
  schoolId: string;

  @ApiPropertyOptional({
    description: 'User identityCode (Student Identity)',
    type: 'string',
    example: 'SV123456',
  })
  @IsOptional()
  @IsString()
  identityCode?: string;
}
