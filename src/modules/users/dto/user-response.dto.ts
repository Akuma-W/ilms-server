import { ApiProperty } from '@nestjs/swagger';
import { Role, UserStatus } from 'src/generated/prisma/enums';

export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  fullName: string;

  @ApiProperty({ enum: Role })
  role: Role;

  @ApiProperty({ enum: UserStatus })
  status: UserStatus;

  @ApiProperty()
  schoolId: string;

  @ApiProperty({ required: false })
  avatarUrl?: string;
}
