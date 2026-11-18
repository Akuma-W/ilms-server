import { ApiProperty } from '@nestjs/swagger';

export class AdminOverviewEntity {
  @ApiProperty({
    description: 'Total registered user accounts',
    example: 1250,
    type: 'number',
  })
  totalUsers!: number;

  @ApiProperty({
    description: 'Total registered students',
    example: 1100,
    type: 'number',
  })
  totalStudents!: number;

  @ApiProperty({
    description: 'Total registered teachers',
    example: 140,
    type: 'number',
  })
  totalTeachers!: number;

  @ApiProperty({
    description: 'Total administrators',
    example: 10,
    type: 'number',
  })
  totalAdmins!: number;

  @ApiProperty({
    description: 'Total locked user accounts',
    example: 8,
    type: 'number',
  })
  lockedUsers!: number;

  @ApiProperty({
    description: 'Total schools registered',
    example: 15,
    type: 'number',
  })
  totalSchools!: number;

  @ApiProperty({
    description: 'Total actively operating schools',
    example: 14,
    type: 'number',
  })
  activeSchools!: number;

  @ApiProperty({
    description: 'Total inactive or suspended schools',
    example: 1,
    type: 'number',
  })
  inactiveSchools!: number;

  @ApiProperty({
    description: 'Total classes created across system',
    example: 120,
    type: 'number',
  })
  totalClasses!: number;

  @ApiProperty({
    description: 'Total active non-archived classes',
    example: 105,
    type: 'number',
  })
  activeClasses!: number;

  @ApiProperty({
    description: 'Total archived classes',
    example: 15,
    type: 'number',
  })
  archivedClasses!: number;

  @ApiProperty({
    description: 'Total student enrollments across classes',
    example: 3450,
    type: 'number',
  })
  totalEnrollments!: number;

  @ApiProperty({
    description: 'Total quizzes created',
    example: 340,
    type: 'number',
  })
  totalQuizzes!: number;

  @ApiProperty({
    description: 'Total published public quizzes',
    example: 210,
    type: 'number',
  })
  publicQuizzes!: number;

  @ApiProperty({
    description: 'Total private unlisted quizzes',
    example: 130,
    type: 'number',
  })
  privateQuizzes!: number;

  @ApiProperty({
    description: 'Total student quiz attempts',
    example: 8400,
    type: 'number',
  })
  totalAttempts!: number;

  @ApiProperty({
    description: 'Total AI assistant requests processed',
    example: 1520,
    type: 'number',
  })
  totalAIRequests!: number;
}
