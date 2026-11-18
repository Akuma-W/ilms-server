import { ApiProperty } from '@nestjs/swagger';

export class AdminGrowthEntity {
  @ApiProperty({
    description: 'Formatted date of the metric record',
    example: '2026-11-17',
    type: 'string',
  })
  date!: string;

  @ApiProperty({
    description: 'Number of newly registered users on that date',
    example: 12,
    type: 'number',
  })
  newUsers!: number;

  @ApiProperty({
    description: 'Number of newly created classes on that date',
    example: 3,
    type: 'number',
  })
  newClasses!: number;

  @ApiProperty({
    description: 'Number of quiz examination attempts taken on that date',
    example: 45,
    type: 'number',
  })
  quizAttempts!: number;
}
