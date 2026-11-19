import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateAdminClassDto {
  @ApiPropertyOptional({
    description: 'Updated title of the classroom',
    example: 'Lập trình Web Nâng Cao',
    type: 'string',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({
    description: 'Reassigned lead teacher UUID',
    example: 'a0000000-0000-0000-0000-000000000001',
    type: 'string',
  })
  @IsOptional()
  @IsUUID('4')
  teacherId?: string;

  @ApiPropertyOptional({
    description: 'Capacity of students permitted in classroom',
    example: 80,
    type: 'number',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(500)
  maxStudents?: number;

  @ApiPropertyOptional({
    description: 'Access visibility setting for classroom',
    example: true,
    type: 'boolean',
  })
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;
}
