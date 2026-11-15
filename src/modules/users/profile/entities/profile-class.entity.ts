import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProfileClassTeacherEntity } from './profile-class-teacher.entity';
import { ProfileClassEnrollmentEntity } from './profile-class-enrollment.entity';

export class ProfileClassEntity {
  @ApiProperty({
    description: 'Unique identifier of the class',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: 'string',
  })
  id!: string;

  @ApiPropertyOptional({
    description: 'Course code identifier',
    example: 'CS101',
    type: 'string',
  })
  courseCode?: string | null;

  @ApiProperty({
    description: 'Class title',
    example: 'Lap trinh Huong doi tuong',
    type: 'string',
  })
  title!: string;

  @ApiPropertyOptional({
    description: 'Class description',
    example: 'Khoa hoc lap trinh Java co ban',
    type: 'string',
  })
  description?: string | null;

  @ApiPropertyOptional({
    description: 'Academic subject',
    example: 'Khoa hoc May tinh',
    type: 'string',
  })
  subject?: string | null;

  @ApiPropertyOptional({
    description: 'Academic semester',
    example: 'HK1 2026-2027',
    type: 'string',
  })
  semester?: string | null;

  @ApiProperty({
    description: 'Total approved students in this class',
    example: 45,
    type: 'number',
  })
  totalStudents!: number;

  @ApiProperty({
    description: 'Total active learning topics in this class',
    example: 5,
    type: 'number',
  })
  totalTopics!: number;

  @ApiProperty({
    description: 'Total published assignments in this class',
    example: 3,
    type: 'number',
  })
  totalAssignments!: number;

  @ApiProperty({
    description: 'Total published quizzes in this class',
    example: 2,
    type: 'number',
  })
  totalQuizzes!: number;

  @ApiProperty({
    description: 'Class creation timestamp',
    example: '2026-11-01T12:00:00.000Z',
    type: 'string',
  })
  createdAt?: Date | null;

  @ApiPropertyOptional({
    description: 'Instructor information',
    type: () => ProfileClassTeacherEntity,
  })
  teacher?: ProfileClassTeacherEntity | null;

  @ApiPropertyOptional({
    description: 'Enrollment details for student role',
    type: () => ProfileClassEnrollmentEntity,
  })
  enrollment?: ProfileClassEnrollmentEntity | null;
}
