import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreateSubjectDto {
  @ApiProperty({
    description: 'UUID of the school offering this subject',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: 'string',
  })
  @IsUUID('4')
  @IsNotEmpty()
  schoolId!: string;

  @ApiProperty({
    description: 'Code of the subject (unique per school)',
    example: 'IT001',
    type: 'string',
  })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty({
    description: 'Full name of the subject',
    example: 'Nhập môn lập trình',
    type: 'string',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({
    description: 'Detailed syllabus or subject description',
    example: 'Môn học cơ sở ngành về tư duy lập trình và giải thuật cơ bản',
    type: 'string',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Number of credits (1 to 20)',
    example: 4,
    type: 'number',
  })
  @IsInt()
  @Min(1)
  @Max(20)
  @IsOptional()
  credits?: number;

  @ApiPropertyOptional({
    description: 'Whether the subject is active',
    example: true,
    type: 'boolean',
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
