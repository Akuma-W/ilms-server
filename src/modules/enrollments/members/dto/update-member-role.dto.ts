import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { Role } from 'src/generated/prisma/enums';

export class UpdateMemberRoleDto {
  @ApiProperty({
    description: 'New role of the member in class',
    type: 'string',
    enum: Role,
    example: Role.teacher,
  })
  @IsEnum(Role)
  role: Role;
}
