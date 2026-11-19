import { ApiProperty } from '@nestjs/swagger';
import { GradeCategoryEntity } from '../../categories/entities/grade-category.entity';
import { ClassGradeMatrixRowEntity } from './grade-matrix-row.entity';

export class ClassGradeMatrixEntity {
  @ApiProperty({
    description: 'Grade categories configured for this classroom',
    type: [GradeCategoryEntity],
  })
  categories!: GradeCategoryEntity[];

  @ApiProperty({
    description: 'Student rows with individual scores and final summary',
    type: [ClassGradeMatrixRowEntity],
  })
  rows!: ClassGradeMatrixRowEntity[];

  @ApiProperty({
    description: 'Total number of enrolled students',
    example: 45,
    type: 'number',
  })
  totalStudents!: number;

  @ApiProperty({
    description: 'Average final score across the classroom',
    example: '7.85',
    type: 'string',
  })
  averageScore!: string;

  @ApiProperty({
    description: 'Percentage of students who passed with score >= 5.0',
    example: 92.5,
    type: 'number',
  })
  passingRate!: number;
}
