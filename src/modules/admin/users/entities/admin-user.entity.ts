import { ApiProperty } from '@nestjs/swagger';
import { Role, UserStatus } from 'src/generated/prisma/enums';
import { GeneralSchoolEntity } from '../../entities/general-school.entity';
import { GeneralUserEntity } from '../../entities/general-user.entity';

export class AdminUserEntity extends GeneralUserEntity {
  @ApiProperty({
    description: 'Student or teacher identity code',
    example: 'SV2026001',
    type: 'string',
    nullable: true,
  })
  identityCode!: string | null;

  @ApiProperty({
    description: 'System role',
    example: Role.student,
    enum: Role,
    type: 'string',
  })
  role!: Role;

  @ApiProperty({
    description: 'Account operational status',
    example: UserStatus.active,
    enum: UserStatus,
    type: 'string',
  })
  status!: UserStatus;

  @ApiProperty({
    description: 'Affiliated educational institution UUID',
    example: 'a0000000-0000-0000-0000-000000000001',
    type: 'string',
  })
  schoolId!: string;

  @ApiProperty({
    description: 'Affiliated school information',
    type: () => GeneralSchoolEntity,
  })
  school!: GeneralSchoolEntity;

  @ApiProperty({
    description: 'Account creation timestamp',
    example: '2026-11-01T08:00:00.000Z',
    type: 'string',
    nullable: true,
  })
  createdAt!: Date | null;

  @ApiProperty({
    description: 'Last profile update timestamp',
    example: '2026-11-17T09:00:00.000Z',
    type: 'string',
    nullable: true,
  })
  updatedAt!: Date | null;
}
