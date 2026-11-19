import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AttendanceStudentItemEntity {
  @ApiProperty({
    description: 'Student UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: 'string',
  })
  studentId!: string;

  @ApiProperty({
    description: 'Full name of the student',
    example: 'John Doe',
    type: 'string',
  })
  studentName!: string;

  @ApiProperty({
    description: 'Email address of the student',
    example: 'student@school.edu.vn',
    type: 'string',
  })
  studentEmail!: string;

  @ApiProperty({
    description: 'Student identity code',
    example: 'SV-001234',
    type: 'string',
  })
  studentCode!: string;

  @ApiPropertyOptional({
    description: 'Avatar image URL of the student',
    example: 'https://minio.lms.edu.vn/avatars/user.png',
    type: 'string',
  })
  avatarUrl?: string | null;

  @ApiProperty({
    description: 'Number of completed learning materials',
    example: 8,
    type: 'number',
  })
  completedMaterials!: number;

  @ApiProperty({
    description: 'Total number of learning materials in the class',
    example: 10,
    type: 'number',
  })
  totalMaterials!: number;

  @ApiProperty({
    description: 'Completion rate of learning materials (%)',
    example: 80,
    type: 'number',
  })
  materialRate!: number;

  @ApiProperty({
    description: 'Number of attended virtual meeting sessions',
    example: 4,
    type: 'number',
  })
  attendedSessions!: number;

  @ApiProperty({
    description: 'Total number of virtual meeting sessions in the class',
    example: 5,
    type: 'number',
  })
  totalSessions!: number;

  @ApiProperty({
    description: 'Attendance rate of meeting sessions (%)',
    example: 80,
    type: 'number',
  })
  sessionRate!: number;

  @ApiProperty({
    description: 'Calculated attendance score on a 10-point scale',
    example: 8.0,
    type: 'number',
  })
  calculatedScore!: number;

  @ApiPropertyOptional({
    description: 'Current saved grade score in gradebook if recorded',
    example: 8.5,
    type: 'number',
  })
  currentScore?: number | null;
}
