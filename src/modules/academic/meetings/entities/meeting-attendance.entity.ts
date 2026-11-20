import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MeetingAttendanceEntity {
  @ApiProperty({
    description: 'Unique identifier of attendance record',
    example: 'att-11111111-1111-1111-1111-111111111111',
    type: 'string',
  })
  id!: string;

  @ApiProperty({
    description: 'Meeting session UUID',
    example: 'm1111111-1111-1111-1111-111111111111',
    type: 'string',
  })
  sessionId!: string;

  @ApiProperty({
    description: 'Class UUID identifier',
    example: 'c1111111-1111-1111-1111-111111111111',
    type: 'string',
  })
  classId!: string;

  @ApiProperty({
    description: 'Student UUID identifier',
    example: 's1111111-1111-1111-1111-111111111111',
    type: 'string',
  })
  studentId!: string;

  @ApiProperty({
    description: 'Student full name',
    example: 'Nguyen Van A',
    type: 'string',
  })
  studentName!: string;

  @ApiProperty({
    description: 'Student academic email',
    example: 'nguyenvana@edu.vn',
    type: 'string',
  })
  studentEmail!: string;

  @ApiPropertyOptional({
    description: 'Student identification code',
    example: 'SV-2026-001',
    type: 'string',
  })
  identityCode?: string | null;

  @ApiPropertyOptional({
    description: 'Student avatar URL',
    example: 'https://cdn.ilms.local/avatars/user-1.png',
    type: 'string',
  })
  avatarUrl?: string | null;

  @ApiProperty({
    description: 'First join timestamp of student',
    example: '2026-11-20T19:32:15.000Z',
    type: 'string',
  })
  joinedAt!: Date;

  @ApiPropertyOptional({
    description: 'Duration spent in meeting session in minutes',
    example: 85,
    type: 'number',
  })
  durationMinutes?: number | null;
}
