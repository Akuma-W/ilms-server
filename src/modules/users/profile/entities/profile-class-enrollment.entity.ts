import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProfileClassEnrollmentEntity {
  @ApiProperty({
    description: 'Enrollment record unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174001',
    type: 'string',
  })
  id!: string;

  @ApiProperty({
    description: 'Enrollment approval status',
    example: 'approved',
    type: 'string',
  })
  status!: string;

  @ApiProperty({
    description: 'Role of the member inside class',
    example: 'student',
    type: 'string',
  })
  role!: string;

  @ApiPropertyOptional({
    description: 'Timestamp when member joined the class',
    example: '2026-11-01T12:00:00.000Z',
    type: 'string',
  })
  joinedAt?: Date | null;
}
