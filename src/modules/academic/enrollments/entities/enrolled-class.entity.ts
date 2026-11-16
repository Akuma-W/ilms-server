import { ApiProperty } from '@nestjs/swagger';
import { EnrollmentStatus, Role } from 'src/generated/prisma/enums';

class EnrolledClassTeacher {
  @ApiProperty({
    description: 'Teacher unique identifier',
    type: 'string',
    example: 'a3f1c9b2-1234-4cde-9abc-1234567890ab',
  })
  id!: string;

  @ApiProperty({
    description: 'Teacher full name',
    type: 'string',
    example: 'John Doe',
  })
  fullName!: string;

  @ApiProperty({
    description: 'Teacher email address',
    type: 'string',
    example: 'teacher@school.edu.vn',
  })
  email!: string;

  @ApiProperty({
    description: 'Teacher avatar URL',
    type: 'string',
    nullable: true,
    example: 'https://cdn.school.edu/avatars/user.jpg',
  })
  avatarUrl!: string | null;

  @ApiProperty({
    description: 'System role',
    type: 'string',
    enum: Role,
    example: Role.teacher,
  })
  role!: Role;
}

class EnrolledClassSchool {
  @ApiProperty({
    description: 'School unique identifier',
    type: 'string',
    example: 's1e2e3e4-1234-5678-9abc-def012345678',
  })
  id!: string;

  @ApiProperty({
    description: 'School name',
    type: 'string',
    example: 'Hanoi University of Science and Technology',
  })
  name!: string;
}

class EnrolledClassMeta {
  @ApiProperty({
    description: 'Enrollment record identifier',
    type: 'string',
    example: 'e1f2g3h4-1234-5678-9abc-def012345678',
  })
  id!: string;

  @ApiProperty({
    description: 'Current enrollment status',
    type: 'string',
    enum: EnrollmentStatus,
    example: EnrollmentStatus.approved,
  })
  status!: EnrollmentStatus;

  @ApiProperty({
    description: 'Whether the user starred this class',
    type: 'boolean',
    example: true,
  })
  isStarred!: boolean;

  @ApiProperty({
    description: 'User role inside this class',
    type: 'string',
    enum: Role,
    example: Role.student,
  })
  roleIn!: Role;

  @ApiProperty({
    description: 'Timestamp when approved',
    type: 'string',
    nullable: true,
    example: '2026-03-19T10:00:00.000Z',
  })
  joinedAt!: Date | null;
}

export class EnrolledClassEntity {
  @ApiProperty({
    description: 'Class unique identifier',
    type: 'string',
    example: 'b2c1d9e8-5678-4abc-9def-0987654321ab',
  })
  id!: string;

  @ApiProperty({
    description: 'Class title',
    type: 'string',
    example: 'Lập trình Web nâng cao',
  })
  title!: string;

  @ApiProperty({
    description: 'Class description',
    type: 'string',
    nullable: true,
    example: 'Khóa học lập trình Fullstack với NestJS và Next.js',
  })
  description!: string | null;

  @ApiProperty({
    description: 'Unique 6-character class code',
    type: 'string',
    example: 'CS102A',
  })
  courseCode!: string;

  @ApiProperty({
    description: 'Subject name',
    type: 'string',
    example: 'Computer Science',
  })
  subject!: string;

  @ApiProperty({
    description: 'Semester label',
    type: 'string',
    example: 'Học kỳ 1 - 2026',
  })
  semester!: string;

  @ApiProperty({
    description: 'Privacy flag requiring teacher approval to join',
    type: 'boolean',
    example: false,
  })
  isPrivate!: boolean;

  @ApiProperty({
    description: 'Google Meet or online conference link',
    type: 'string',
    nullable: true,
    example: 'https://meet.google.com/abc-defg-hij',
  })
  meetingUri!: string | null;

  @ApiProperty({
    description: 'Online meeting space identifier',
    type: 'string',
    nullable: true,
    example: 'space-123456',
  })
  meetingSpaceId!: string | null;

  @ApiProperty({
    description: 'Read-only archive state',
    type: 'boolean',
    example: false,
  })
  isArchived!: boolean;

  @ApiProperty({
    description: 'Creation timestamp',
    type: 'string',
    example: '2026-01-15T08:00:00.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Associated school identifier',
    type: 'string',
    example: 's1e2e3e4-1234-5678-9abc-def012345678',
  })
  schoolId!: string;

  @ApiProperty({
    description: 'Primary teacher identifier',
    type: 'string',
    example: 'a3f1c9b2-1234-4cde-9abc-1234567890ab',
  })
  teacherId!: string;

  @ApiProperty({
    description: 'School details',
    type: () => EnrolledClassSchool,
    example: { id: 's1e2e3e4', name: 'HUST' },
  })
  school!: EnrolledClassSchool;

  @ApiProperty({
    description: 'Instructor details',
    type: () => EnrolledClassTeacher,
    example: { id: 'a3f1c9b2', fullName: 'Nguyen Van A' },
  })
  teacher!: EnrolledClassTeacher;

  @ApiProperty({
    description: 'Total active students enrolled',
    type: 'number',
    example: 45,
  })
  totalStudents!: number;

  @ApiProperty({
    description: 'User enrollment relationship details',
    type: () => EnrolledClassMeta,
    example: { status: 'approved', isStarred: true },
  })
  enrollment!: EnrolledClassMeta;
}
