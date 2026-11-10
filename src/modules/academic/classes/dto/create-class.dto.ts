import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateClassDto {
  @ApiProperty({
    description: 'Title / Name of class',
    type: 'string',
    example: 'Lập trình Web với NestJS',
  })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiProperty({
    description: 'Subject class teaching',
    type: 'string',
    example: 'SE347 - Ứng dụng web',
  })
  @IsString()
  @MaxLength(255)
  subject: string;

  @ApiProperty({
    description: 'Class status: public or private',
    type: 'boolean',
    example: false,
    default: false,
  })
  @IsBoolean()
  isPrivate: boolean;

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
