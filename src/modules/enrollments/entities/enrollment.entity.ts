import { ApiProperty } from '@nestjs/swagger';
import { EnrollmentStatus, Role } from 'src/generated/prisma/enums';

export class Enrollment {
  @ApiProperty({
    description: 'Id of enrollment',
    type: 'string',
    example: 'e1f2g3h4-1234-5678-9abc-def012345678',
  })
  id: string;

  @ApiProperty({
    description: 'Id of user join class',
    type: 'string',
    example: 'a3f1c9b2-1234-4cde-9abc-1234567890ab',
  })
  userId: string;

  @ApiProperty({
    description: 'ID of class',
    type: 'string',
    example: 'b2c1d9e8-5678-4abc-9def-0987654321ab',
  })
  classId: string;

  @ApiProperty({
    description: 'Role in class',
    enum: Role,
    default: Role.student,
    example: 'student',
  })
  roleIn: Role;

  @ApiProperty({
    description: 'Mark the class with a star',
    type: 'boolean',
    default: false,
  })
  isStarred: boolean;

  @ApiProperty({
    description: 'Time join class',
    example: '2026-03-19T10:00:00.000Z',
    nullable: true,
  })
  joinedAt: Date;

  @ApiProperty({
    description: 'Status of enrollment',
    enum: EnrollmentStatus,
    default: EnrollmentStatus.pending,
  })
  status: EnrollmentStatus;
}
