import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GradeBreakdownItemEntity {
  @ApiProperty({
    description: 'Identifier of the component item or milestone',
    example: 'assign-a1-uuid',
    type: 'string',
  })
  id!: string;

  @ApiProperty({
    description: 'Title of the component item',
    example: 'Practice Assignment A2: Recursive Algorithms',
    type: 'string',
  })
  title!: string;

  @ApiProperty({
    description:
      'Component artifact type (assignment, quiz, meeting, material)',
    example: 'assignment',
    type: 'string',
  })
  type!: string;

  @ApiPropertyOptional({
    description: 'Achieved raw score on scale 10',
    example: 8.5,
    type: 'number',
  })
  score?: number | null;

  @ApiProperty({
    description: 'Maximum obtainable score or scale ceiling',
    example: 10,
    type: 'number',
  })
  maxScore!: number;

  @ApiPropertyOptional({
    description: 'Participation or completion rate percentage (0 - 100)',
    example: 100,
    type: 'number',
  })
  rate?: number | null;

  @ApiProperty({
    description: 'Relative weight or contribution multiplier of this item',
    example: 1.0,
    type: 'number',
  })
  weight!: number;

  @ApiProperty({
    description:
      'Current status of the student item (submitted, completed, absent, pending)',
    example: 'submitted',
    type: 'string',
  })
  status!: string;
}
