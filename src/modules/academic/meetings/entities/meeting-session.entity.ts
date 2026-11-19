import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MeetingSessionEntity {
  @ApiProperty({
    description: 'Unique identifier of meeting session',
    example: '11111111-1111-1111-1111-111111111111',
    type: 'string',
  })
  id!: string;

  @ApiProperty({
    description: 'Title of meeting session',
    example: 'Session 1: Course Overview & Syllabus',
    type: 'string',
  })
  title!: string;

  @ApiPropertyOptional({
    description: 'Session description or agenda',
    example: 'Students should prepare chapter 1 slides and laptop',
    type: 'string',
  })
  description?: string | null;

  @ApiProperty({
    description: 'LiveKit room identifier name',
    example: 'class-c1111111-session-1',
    type: 'string',
  })
  roomName!: string;

  @ApiProperty({
    description: 'Scheduled start timestamp',
    example: '2026-11-20T19:30:00.000Z',
    type: 'string',
  })
  startTime!: Date;

  @ApiPropertyOptional({
    description: 'Session conclusion timestamp',
    example: '2026-11-20T21:00:00.000Z',
    type: 'string',
  })
  endTime?: Date | null;

  @ApiProperty({
    description: 'Active status indicating whether room is currently open',
    example: true,
    type: 'boolean',
  })
  isLive!: boolean;

  @ApiPropertyOptional({
    description: 'Review recording URL',
    example: 'https://drive.google.com/file/d/sample-id/view',
    type: 'string',
  })
  recordingUrl?: string | null;

  @ApiProperty({
    description: 'Class UUID identifier',
    example: 'c1111111-1111-1111-1111-111111111111',
    type: 'string',
  })
  classId!: string;

  @ApiPropertyOptional({
    description: 'Total number of students who joined this meeting session',
    example: 35,
    type: 'number',
  })
  attendanceCount?: number;

  @ApiPropertyOptional({
    description: 'Creation timestamp',
    example: '2026-11-20T10:00:00.000Z',
    type: 'string',
  })
  createdAt?: Date | null;

  @ApiPropertyOptional({
    description: 'Last update timestamp',
    example: '2026-11-20T10:00:00.000Z',
    type: 'string',
  })
  updatedAt?: Date | null;
}
