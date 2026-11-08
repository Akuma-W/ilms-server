import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EnrollmentStatus, Role } from 'src/generated/prisma/enums';

class MemberUserInfo {
  @ApiProperty({
    description: 'User ID',
    type: 'string',
    example: 'a3f1c9b2-1234-4cde-9abc-1234567890ab',
  })
  id: string;

  @ApiProperty({
    description: 'User full name',
    type: 'string',
    example: 'Nguyen Van A',
  })
  fullName: string;

  @ApiProperty({
    description: 'User email address',
    type: 'string',
    example: 'vana@example.com',
  })
  email: string;

  @ApiPropertyOptional({
    description: 'Avatar image URL',
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
  role: Role;
}

export class ClassMember {
  @ApiProperty({
    description: 'Enrollment identifier',
    type: 'string',
    example: 'e1f2g3h4-1234-5678-9abc-def012345678',
  })
  id: string;

  @ApiProperty({
    description: 'User identifier',
    type: 'string',
    example: 'a3f1c9b2-1234-4cde-9abc-1234567890ab',
  })
  userId: string;

  @ApiProperty({
    description: 'User profile details',
    type: () => MemberUserInfo,
  })
  user: MemberUserInfo;

  @ApiProperty({
    description: 'Role of the member inside this class',
    type: 'string',
    enum: Role,
    example: Role.student,
  })
  role: Role;

  @ApiProperty({
    description: 'Enrollment status in this class',
    type: 'string',
    enum: EnrollmentStatus,
    example: EnrollmentStatus.approved,
  })
  status: EnrollmentStatus;

  @ApiProperty({
    description: 'Timestamp when the user joined the class',
    type: 'string',
    example: '2026-03-19T10:00:00.000Z',
  })
  joinedAt: Date | string;

  @ApiPropertyOptional({
    description: 'Student identification code',
    type: 'string',
    example: 'SV0001',
    nullable: true,
  })
  studentCode?: string;
}
