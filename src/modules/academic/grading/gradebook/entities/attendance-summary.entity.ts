import { ApiProperty } from '@nestjs/swagger';
import { AttendanceStudentItemEntity } from './attendance-student-item.entity';

export class AttendanceSummaryEntity {
  @ApiProperty({
    description: 'Total number of learning materials in the classroom',
    example: 10,
    type: 'number',
  })
  totalMaterials!: number;

  @ApiProperty({
    description: 'Total number of virtual meeting sessions completed',
    example: 5,
    type: 'number',
  })
  totalSessions!: number;

  @ApiProperty({
    description: 'Configured weight for learning materials component',
    example: 0.5,
    type: 'number',
  })
  materialWeight!: number;

  @ApiProperty({
    description: 'Configured weight for online meetings component',
    example: 0.5,
    type: 'number',
  })
  meetingWeight!: number;

  @ApiProperty({
    description: 'Target attendance grade category identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: 'string',
  })
  categoryId!: string;

  @ApiProperty({
    description:
      'Detailed list of student attendance and progress calculations',
    type: [AttendanceStudentItemEntity],
  })
  students!: AttendanceStudentItemEntity[];
}
