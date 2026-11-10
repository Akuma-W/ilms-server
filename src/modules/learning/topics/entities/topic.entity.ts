import { ApiProperty } from '@nestjs/swagger';

export class Topic {
  @ApiProperty({
    description: 'Unique identifier of the topic',
    type: 'string',
    example: '133c7575-1b40-4ba3-9a24-9484964b9a24',
  })
  id: string;

  @ApiProperty({
    description: 'Title of the topic',
    type: 'string',
    example: 'Chương 1: Giới thiệu',
  })
  title: string;

  @ApiProperty({
    description: 'Description of the topic',
    type: 'string',
    example: 'Mô tả tổng quan về khóa học',
    nullable: true,
  })
  description?: string;

  @ApiProperty({
    description: 'Display order index of the topic',
    type: 'number',
    example: 1,
  })
  orderIndex: number;

  @ApiProperty({
    description: 'Timestamp when the topic was created',
    type: 'string',
    example: '2026-03-19T10:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'ID of the class this topic belongs to',
    type: 'string',
    example: 'b2c1d9e8-5678-4abc-9def-0987654321ab',
  })
  classId: string;

  @ApiProperty({
    description: 'User ID of the topic creator',
    type: 'string',
    example: 'a3f1c9b2-1234-4cde-9abc-1234567890ab',
  })
  createdBy: string;
}
