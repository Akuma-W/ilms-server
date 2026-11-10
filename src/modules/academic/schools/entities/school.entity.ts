import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SchoolStatus } from 'src/generated/prisma/enums';

export class SchoolEntity {
  @ApiProperty({
    description: 'Unique identifier of the school',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: 'string',
  })
  id: string;

  @ApiProperty({
    description: 'Full name of the school institution',
    example: 'University of Information Technology',
    type: 'string',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Short name or acronym of the school',
    example: 'UIT',
    type: 'string',
  })
  shortname?: string | null;

  @ApiPropertyOptional({
    description: 'Physical address of the campus',
    example: 'Quarter 6, Linh Trung Ward, Thu Duc City',
    type: 'string',
  })
  address?: string | null;

  @ApiProperty({
    description: 'City where the school is located',
    example: 'Ho Chi Minh City',
    type: 'string',
  })
  city: string;

  @ApiProperty({
    description: 'Operational status of the school',
    example: 'active',
    enum: SchoolStatus,
    type: 'string',
  })
  status: SchoolStatus;

  @ApiPropertyOptional({
    description: 'Creation timestamp',
    example: '2026-11-01T12:00:00.000Z',
    type: 'string',
  })
  createdAt?: Date | string | null;

  @ApiPropertyOptional({
    description: 'Last update timestamp',
    example: '2026-11-05T12:00:00.000Z',
    type: 'string',
  })
  updatedAt?: Date | string | null;
}

export class School extends SchoolEntity {}
