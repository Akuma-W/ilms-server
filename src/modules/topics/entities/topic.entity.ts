import { ApiProperty } from '@nestjs/swagger';

export class Topic {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Chương 1' })
  title: string;

  @ApiProperty({ example: 'Mô tả', nullable: true })
  description?: string;

  @ApiProperty({ example: 1 })
  orderIndex: number;

  @ApiProperty({ example: '2026-03-19T10:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: 'class-uuid' })
  classId: string;

  @ApiProperty({ example: 'user-uuid' })
  createdBy: string;
}
