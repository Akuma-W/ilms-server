import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProfileClassTeacherEntity {
  @ApiProperty({
    description: 'Unique identifier of the instructor',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: 'string',
  })
  id!: string;

  @ApiProperty({
    description: 'Full name of the instructor',
    example: 'Dr. Nguyen Van A',
    type: 'string',
  })
  fullName!: string;

  @ApiProperty({
    description: 'Email address of the instructor',
    example: 'teacher@example.com',
    type: 'string',
  })
  email!: string;

  @ApiPropertyOptional({
    description: 'Avatar image storage path or URL',
    example: '/avatars/teacher.png',
    type: 'string',
  })
  avatarUrl?: string | null;
}
