import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from 'src/generated/prisma/enums';

export class MemberUserInfo {
  @ApiProperty({
    description: 'User ID',
    type: 'string',
    example: 'a3f1c9b2-1234-4cde-9abc-1234567890ab',
  })
  id!: string;

  @ApiProperty({
    description: 'User full name',
    type: 'string',
    example: 'Nguyen Van A',
  })
  fullName!: string;

  @ApiProperty({
    description: 'User email address',
    type: 'string',
    example: 'vana@example.com',
  })
  email!: string;

  @ApiPropertyOptional({
    description: 'Public accessible avatar image URL',
    type: 'string',
    example: 'https://example.com/avatar.jpg',
    nullable: true,
  })
  avatarUrl?: string | null;

  @ApiPropertyOptional({
    description: 'Student or teacher code',
    type: 'string',
    example: 'SV0001',
    nullable: true,
  })
  identityCode?: string | null;

  @ApiProperty({
    description: 'System role of the user',
    type: 'string',
    enum: Role,
    example: Role.student,
  })
  role!: Role;
}
