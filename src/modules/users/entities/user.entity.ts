import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role, UserStatus } from 'src/generated/prisma/enums';
import { SchoolEntity } from 'src/modules/academic/schools/entities/school.entity';

export class UserEntity {
  @ApiProperty({
    description: 'Unique identifier of the user.',
    example: 'usr_123456789',
    type: String,
  })
  id!: string;

  @ApiProperty({
    description: 'Email address of the user.',
    example: 'jane.doe@example.com',
    type: String,
  })
  email!: string;

  @ApiProperty({
    description: 'Full name of the user.',
    example: 'Jane Doe',
    type: String,
  })
  fullName!: string;

  @ApiProperty({
    description: 'Role assigned to the user.',
    example: Object.values(Role)[0],
    enum: Role,
    type: String,
  })
  role!: Role;

  @ApiProperty({
    description: 'Identifier of the school associated with the user.',
    example: 'sch_123456789',
    type: String,
  })
  schoolId!: string;

  @ApiProperty({
    description: 'Public accessible URL of the user avatar.',
    example: 'https://example.com/avatars/jane-doe.png',
    type: String,
    nullable: true,
  })
  avatarUrl!: string | null;

  @ApiProperty({
    description: 'Identity code assigned to the user.',
    example: 'STU2024001',
    type: String,
    nullable: true,
  })
  identityCode!: string | null;

  @ApiProperty({
    description: 'Current status of the user.',
    example: Object.values(UserStatus)[0],
    enum: UserStatus,
    type: String,
  })
  status!: UserStatus;

  @ApiProperty({
    description: 'Date and time when the user was created.',
    example: '2024-01-15T10:30:00.000Z',
    type: Date,
    nullable: true,
  })
  createdAt!: Date | null;

  @ApiPropertyOptional({
    description: 'School associated with the user, when available.',
    example: { id: 'sch_123456789', name: 'Example School' },
    type: SchoolEntity,
    nullable: true,
  })
  school?: SchoolEntity | null;
}
