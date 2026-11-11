import { ApiProperty } from '@nestjs/swagger';

export class GradeCategoryEntity {
  @ApiProperty({
    description: 'Unique identifier of the grade category',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: 'string',
  })
  id!: string;

  @ApiProperty({
    description: 'Name of the grade category',
    example: 'Chuyên cần',
    type: 'string',
  })
  name!: string;

  @ApiProperty({
    description:
      'Weight of the category in overall grade calculation (0.01 to 1.0)',
    example: 0.2,
    type: 'number',
  })
  weight!: number;

  @ApiProperty({
    description: 'Classroom ID associated with this category',
    example: '123e4567-e89b-12d3-a456-426614174001',
    type: 'string',
  })
  classId!: string;

  @ApiProperty({
    description: 'Display sequence order index of the category',
    example: 1,
    type: 'number',
  })
  orderIndex!: number;
}
