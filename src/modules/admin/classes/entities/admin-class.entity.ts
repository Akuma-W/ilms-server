import { ApiProperty } from '@nestjs/swagger';
import { GeneralUserEntity } from '../../entities/general-user.entity';
import { AdminSubjectEntity } from './admin-subject.entity';
import { GeneralSchoolEntity } from '../../entities/general-school.entity';

export class AdminClassEntity {
  @ApiProperty({
    description: 'Class UUID identifier',
    example: 'c0000000-0000-0000-0000-000000000001',
    type: 'string',
  })
  id!: string;

  @ApiProperty({
    description: 'Class section title',
    example: 'Lập trình C++ căn bản - Nhóm 01',
    type: 'string',
  })
  title!: string;

  @ApiProperty({
    description: 'Class description',
    example: 'Môn học trang bị kiến thức lập trình cơ bản',
    type: 'string',
    nullable: true,
  })
  description!: string | null;

  @ApiProperty({
    description: 'Alphanumeric enrollment course code',
    example: 'CPP2026',
    type: 'string',
    nullable: true,
  })
  courseCode!: string | null;

  @ApiProperty({
    description: 'Semester session indicator',
    example: 'HK1_2026',
    type: 'string',
    nullable: true,
  })
  semester!: string | null;

  @ApiProperty({
    description: 'Private approval-required flag',
    example: false,
    type: 'boolean',
  })
  isPrivate!: boolean;

  @ApiProperty({
    description: 'Archived read-only state flag',
    example: false,
    type: 'boolean',
  })
  isArchived!: boolean;

  @ApiProperty({
    description: 'Total current students enrolled',
    example: 58,
    type: 'number',
  })
  totalStudents!: number;

  @ApiProperty({
    description: 'Capacity ceiling for students',
    example: 60,
    type: 'number',
    nullable: true,
  })
  maxStudents!: number | null;

  @ApiProperty({
    description: 'Class creation timestamp',
    example: '2026-11-01T08:00:00.000Z',
    type: 'string',
    nullable: true,
  })
  createdAt!: Date | null;

  @ApiProperty({
    description: 'Lead instructor details',
    type: () => GeneralUserEntity,
  })
  teacher!: GeneralUserEntity;

  @ApiProperty({
    description: 'Associated curriculum subject',
    type: () => AdminSubjectEntity,
  })
  subjectRef!: AdminSubjectEntity;

  @ApiProperty({
    description: 'Affiliated educational institution',
    type: () => GeneralSchoolEntity,
  })
  school!: GeneralSchoolEntity;
}
