import { ApiProperty } from '@nestjs/swagger';

export class RecentActivityEntity {
  @ApiProperty({
    description: 'Unique activity identifier',
    example: 'act-001',
    type: 'string',
  })
  id!: string;

  @ApiProperty({
    description: 'Event type category',
    example: 'class_created',
    type: 'string',
  })
  type!: string;

  @ApiProperty({
    description: 'Human-readable action description',
    example: 'Giảng viên Nguyễn Văn A đã mở lớp mới',
    type: 'string',
  })
  description!: string;

  @ApiProperty({
    description: 'Actor display name',
    example: 'ThS. Nguyễn Văn A',
    type: 'string',
  })
  actorName!: string;

  @ApiProperty({
    description: 'Timestamp when event occurred',
    example: '2026-11-17T10:30:00.000Z',
    type: 'string',
  })
  createdAt!: Date;
}
