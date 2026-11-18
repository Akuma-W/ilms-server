import { ApiProperty } from '@nestjs/swagger';

export class GeneralUserEntity {
  @ApiProperty({
    description: 'User UUID',
    example: 'u0000000-0000-0000-0000-000000000001',
    type: 'string',
  })
  id!: string;

  @ApiProperty({
    description: 'Full legal name',
    example: 'ThS. Nguyễn Văn A',
    type: 'string',
  })
  fullName!: string;

  @ApiProperty({
    description: 'User email',
    example: 'teacher@school.edu.vn',
    type: 'string',
  })
  email!: string;

  @ApiProperty({
    description: 'Avatar asset path',
    example: 'avatar.png',
    type: 'string',
    nullable: true,
  })
  avatarUrl!: string | null;
}
