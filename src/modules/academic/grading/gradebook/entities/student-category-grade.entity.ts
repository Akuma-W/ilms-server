import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StudentCategoryGradeEntity {
  @ApiProperty({
    description: 'Category UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: 'string',
  })
  categoryId!: string;

  @ApiProperty({
    description: 'Category display name',
    example: 'Attendance',
    type: 'string',
  })
  categoryName!: string;

  @ApiProperty({
    description: 'Category weight (0.01 to 1.0)',
    example: 0.2,
    type: 'number',
  })
  weight!: number;

  @ApiPropertyOptional({
    description: 'Raw score earned in this category on 10-point scale',
    example: 9.0,
    type: 'number',
    nullable: true,
  })
  score!: number | null;

  @ApiPropertyOptional({
    description: 'Weighted score contribution (score * weight)',
    example: 1.8,
    type: 'number',
    nullable: true,
  })
  weightedScore!: number | null;
}
