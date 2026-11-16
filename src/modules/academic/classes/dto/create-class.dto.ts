import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateClassDto {
  @ApiProperty({
    description: 'Title / Name of class',
    type: 'string',
    example: 'Lập trình Web với NestJS',
  })
  @IsString()
  @MaxLength(255)
  title!: string;

  @ApiProperty({
    description: 'Identifier of the academic subject offering this class',
    type: 'string',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4')
  subjectId!: string;

  @ApiProperty({
    description: 'Class status: public or private',
    type: 'boolean',
    example: false,
    default: false,
  })
  @IsBoolean()
  isPrivate!: boolean;

  @ApiPropertyOptional({
    description: 'Maximum student capacity for this class',
    type: 'number',
    example: 60,
    default: 60,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(500)
  maxStudents?: number;

  @ApiPropertyOptional({
    description:
      'List of assistant teacher user IDs to assign upon class creation',
    type: 'array',
    example: ['123e4567-e89b-12d3-a456-426614174001'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  assistantIds?: string[];

  @ApiPropertyOptional({
    description: 'Description / Introducion of class',
    type: 'string',
    example: 'Khóa học dành cho sinh viên năm 3',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Semester of class',
    type: 'string',
    example: 'Fall 2026',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  semester?: string;
}
