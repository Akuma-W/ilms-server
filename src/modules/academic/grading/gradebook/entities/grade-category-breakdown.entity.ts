import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GradeBreakdownItemEntity } from './grade-breakdown-item.entity';

export class GradeCategoryBreakdownEntity {
  @ApiProperty({
    description: 'Grade category UUID identifier',
    example: 'cat-1111111-1111-1111-1111-111111111111',
    type: 'string',
  })
  categoryId!: string;

  @ApiProperty({
    description: 'Grade category display name',
    example: 'Practice Lab',
    type: 'string',
  })
  categoryName!: string;

  @ApiProperty({
    description: 'Category weight percentage in course total',
    example: 20,
    type: 'number',
  })
  weight!: number;

  @ApiProperty({
    description:
      'Calculation strategy applied (manual, attendance_threshold, composite_average)',
    example: 'composite_average',
    type: 'string',
  })
  strategy!: string;

  @ApiPropertyOptional({
    description: 'Raw automatically computed score from sources',
    example: 8.5,
    type: 'number',
  })
  rawScore?: number | null;

  @ApiPropertyOptional({
    description: 'Teacher manual override score',
    example: 9.0,
    type: 'number',
  })
  overrideScore?: number | null;

  @ApiProperty({
    description: 'Effective score used for final course calculations',
    example: 9.0,
    type: 'number',
  })
  finalScore!: number;

  @ApiProperty({
    description:
      'Flag indicating whether teacher has manually overridden the grade',
    example: true,
    type: 'boolean',
  })
  isOverridden!: boolean;

  @ApiPropertyOptional({
    description: 'Audit justification reason for manual override',
    example: 'Added 0.5 bonus points for outstanding presentation',
    type: 'string',
  })
  overrideReason?: string | null;

  @ApiProperty({
    description: 'Detailed component items contributing to this grade category',
    type: [GradeBreakdownItemEntity],
  })
  items!: GradeBreakdownItemEntity[];
}
