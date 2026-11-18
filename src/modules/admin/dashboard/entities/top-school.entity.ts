import { ApiProperty } from '@nestjs/swagger';
import { SchoolStatus } from 'src/generated/prisma/enums';
import { GeneralSchoolEntity } from '../../entities/general-school.entity';

export class TopSchoolEntity extends GeneralSchoolEntity {
  @ApiProperty({
    description: 'Number of enrolled students',
    example: 650,
    type: 'number',
  })
  totalStudents!: number;

  @ApiProperty({
    description: 'Number of teachers',
    example: 45,
    type: 'number',
  })
  totalTeachers!: number;

  @ApiProperty({
    description: 'Number of classes opened',
    example: 52,
    type: 'number',
  })
  totalClasses!: number;

  @ApiProperty({
    description: 'Operational status',
    example: SchoolStatus.active,
    enum: SchoolStatus,
    type: 'string',
  })
  status!: SchoolStatus;

  @ApiProperty({
    description: 'Computed institutional activity engagement score',
    example: 1820,
    type: 'number',
  })
  activityScore!: number;
}
