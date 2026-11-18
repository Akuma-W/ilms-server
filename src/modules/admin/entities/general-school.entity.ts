import { ApiProperty } from '@nestjs/swagger';

export class GeneralSchoolEntity {
  @ApiProperty({
    description: 'School UUID',
    example: 'a0000000-0000-0000-0000-000000000001',
    type: 'string',
  })
  id!: string;

  @ApiProperty({
    description: 'School formal name',
    example: 'Đại học Công nghệ Thông tin',
    type: 'string',
  })
  name!: string;

  @ApiProperty({
    description: 'School abbreviation',
    example: 'UIT',
    type: 'string',
    nullable: true,
  })
  shortname!: string | null;
}
