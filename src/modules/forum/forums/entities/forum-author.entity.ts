import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from 'src/generated/prisma/enums';

export class ForumAuthorEntity {
  @ApiProperty({
    description: 'Unique user identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: 'string',
  })
  id!: string;

  @ApiProperty({
    description: 'Full name of author or masked anonymous label',
    example: 'Nguyễn Văn A',
    type: 'string',
  })
  fullName!: string;

  @ApiPropertyOptional({
    description: 'Avatar image URL or null when anonymous',
    example: 'https://example.com/avatar.png',
    type: 'string',
    nullable: true,
  })
  avatar?: string | null;

  @ApiProperty({
    description: 'Role of the author',
    example: Role.student,
    enum: Role,
    type: 'string',
  })
  role!: Role;
}
