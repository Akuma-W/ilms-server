import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubjectEntity {
  @ApiProperty({
    description: 'Unique identifier of the subject',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: 'string',
  })
  id!: string;

  @ApiProperty({
    description: 'School identifier that owns this subject',
    example: '123e4567-e89b-12d3-a456-426614174001',
    type: 'string',
  })
  schoolId!: string;

  @ApiProperty({
    description: 'Subject code issued by school or administration',
    example: 'IT001',
    type: 'string',
  })
  code!: string;

  @ApiProperty({
    description: 'Subject title or course name',
    example: 'Nhập môn lập trình',
    type: 'string',
  })
  name!: string;

  @ApiPropertyOptional({
    description: 'Detailed description of the subject',
    example: 'Môn học cơ sở ngành về tư duy lập trình',
    type: 'string',
  })
  description?: string | null;

  @ApiProperty({
    description: 'Number of academic credits',
    example: 4,
    type: 'number',
  })
  credits!: number;

  @ApiProperty({
    description: 'Active status of the subject',
    example: true,
    type: 'boolean',
  })
  isActive!: boolean;

  @ApiPropertyOptional({
    description: 'Timestamp when subject was created',
    example: '2026-04-10T13:20:56.000Z',
    type: 'string',
  })
  createdAt?: Date | null;

  @ApiPropertyOptional({
    description: 'Timestamp when subject was last updated',
    example: '2026-04-10T13:20:56.000Z',
    type: 'string',
  })
  updatedAt?: Date | null;
}
