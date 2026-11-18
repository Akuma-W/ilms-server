import { ApiProperty } from '@nestjs/swagger';

export class AdminSubjectEntity {
  @ApiProperty({
    description: 'Subject UUID',
    example: 's0000000-0000-0000-0000-000000000001',
    type: 'string',
  })
  id!: string;

  @ApiProperty({
    description: 'Subject code',
    example: 'IT001',
    type: 'string',
  })
  code!: string;

  @ApiProperty({
    description: 'Subject formal title',
    example: 'Nhập môn Lập trình',
    type: 'string',
  })
  name!: string;

  @ApiProperty({
    description: 'Academic credits count',
    example: 3,
    type: 'number',
  })
  credits!: number;
}
