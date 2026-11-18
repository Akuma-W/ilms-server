import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EnrollmentStatus, Role } from 'src/generated/prisma/enums';
import { MemberUserInfo } from './member-info.entity';

export class ClassMemberEntity {
  @ApiProperty({
    description: 'Enrollment identifier',
    type: 'string',
    example: 'e1f2g3h4-1234-5678-9abc-def012345678',
  })
  id!: string;

  @ApiProperty({
    description: 'User identifier',
    type: 'string',
    example: 'a3f1c9b2-1234-4cde-9abc-1234567890ab',
  })
  userId!: string;

  @ApiProperty({
    description: 'User profile details',
    type: () => MemberUserInfo,
  })
  user!: MemberUserInfo;

  @ApiProperty({
    description: 'Role of the member inside this class',
    type: 'string',
    enum: Role,
    example: Role.student,
  })
  role!: Role;

  @ApiProperty({
    description: 'Enrollment status in this class',
    type: 'string',
    enum: EnrollmentStatus,
    example: EnrollmentStatus.approved,
  })
  status!: EnrollmentStatus;

  @ApiProperty({
    description: 'Timestamp when the user joined the class',
    type: 'string',
    nullable: true,
    example: '2026-03-19T10:00:00.000Z',
  })
  joinedAt!: Date | string | null;

  @ApiPropertyOptional({
    description: 'Student identification code',
    type: 'string',
    example: 'SV0001',
    nullable: true,
  })
  studentCode?: string;

  @ApiPropertyOptional({
    description: 'Staff or student identity code',
    type: 'string',
    example: 'SV0001',
    nullable: true,
  })
  identityCode?: string | null;
}
