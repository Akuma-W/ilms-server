import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateAdminClassDto {
  @ApiProperty({
    description: 'Title of the classroom',
    example: 'Lập trình Web với React & Next.js',
    type: 'string',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @ApiProperty({
    description: 'Unique identifier of the subject curriculum',
    example: 'a0000000-0000-0000-0000-000000000001',
    type: 'string',
  })
  @IsUUID('4')
  @IsNotEmpty()
  subjectId!: string;

  @ApiProperty({
    description: 'Unique identifier of the educational school',
    example: 'a0000000-0000-0000-0000-000000000001',
    type: 'string',
  })
  @IsUUID('4')
  @IsNotEmpty()
  schoolId!: string;

  @ApiProperty({
    description: 'Unique identifier of assigned lead teacher',
    example: 'a0000000-0000-0000-0000-000000000001',
    type: 'string',
  })
  @IsUUID('4')
  @IsNotEmpty()
  teacherId!: string;

  @ApiPropertyOptional({
    description: 'Capacity of students permitted in classroom',
    example: 60,
    type: 'number',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(500)
  maxStudents?: number;

  @ApiPropertyOptional({
    description: 'Access visibility setting for classroom',
    example: false,
    type: 'boolean',
  })
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;

  @ApiPropertyOptional({
    description: 'Alphanumeric unique code for classroom identification',
    example: 'WEB101',
    type: 'string',
  })
  @IsOptional()
  @IsString()
  courseCode?: string;
}
