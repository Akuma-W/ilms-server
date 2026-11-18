import { ApiProperty } from '@nestjs/swagger';
import { SchoolStatus } from 'src/generated/prisma/enums';
import { GeneralSchoolEntity } from '../../entities/general-school.entity';

export class AdminSchoolEntity extends GeneralSchoolEntity {
  @ApiProperty({
    description: 'Physical street address of the institution',
    example: 'Khu phố 6, P. Linh Trung, TP. Thủ Đức',
    type: 'string',
    nullable: true,
  })
  address!: string | null;

  @ApiProperty({
    description: 'Municipality or province location',
    example: 'Hồ Chí Minh',
    type: 'string',
  })
  city!: string;

  @ApiProperty({
    description: 'Current operational lifecycle status',
    example: SchoolStatus.active,
    enum: SchoolStatus,
    type: 'string',
  })
  status!: SchoolStatus;

  @ApiProperty({
    description: 'Aggregated total count of enrolled students',
    example: 650,
    type: 'number',
  })
  totalStudents!: number;

  @ApiProperty({
    description: 'Aggregated total count of employed teachers',
    example: 45,
    type: 'number',
  })
  totalTeachers!: number;

  @ApiProperty({
    description: 'Aggregated total count of classes opened',
    example: 52,
    type: 'number',
  })
  totalClasses!: number;

  @ApiProperty({
    description: 'Aggregated total count of subjects established',
    example: 28,
    type: 'number',
  })
  totalSubjects!: number;

  @ApiProperty({
    description: 'Record creation timestamp',
    example: '2026-11-01T08:00:00.000Z',
    type: 'string',
    nullable: true,
  })
  createdAt!: Date | null;

  @ApiProperty({
    description: 'Record last updated timestamp',
    example: '2026-11-17T09:00:00.000Z',
    type: 'string',
    nullable: true,
  })
  updatedAt!: Date | null;
}
