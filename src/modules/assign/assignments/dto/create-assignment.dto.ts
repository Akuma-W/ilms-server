import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { FileType } from 'src/generated/prisma/enums';

export class AssignmentMaterialDto {
  @ApiProperty({
    description: 'Path or storage URL of the attachment',
    type: 'string',
    example: 'materials/guideline.pdf',
  })
  @IsString()
  @IsNotEmpty()
  fileUrl: string;

  @ApiPropertyOptional({
    description: 'Format type of the attachment',
    type: 'string',
    enum: FileType,
    example: 'pdf',
  })
  @IsOptional()
  @IsEnum(FileType)
  fileType?: FileType;

  @ApiPropertyOptional({
    description: 'Original name of the attachment',
    type: 'string',
    example: 'guideline.pdf',
  })
  @IsOptional()
  @IsString()
  fileName?: string;

  @ApiPropertyOptional({
    description: 'Size of file in bytes',
    type: 'number',
    example: 1048576,
  })
  @IsOptional()
  @IsNumber()
  fileSize?: number;
}

export class CreateAssignmentDto {
  @ApiProperty({
    description: 'Title of assignment',
    type: 'string',
    example: 'Assignment 1: Database Design',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    description: 'Detailed instructions and description',
    type: 'string',
    example:
      'Design an ERD diagram and write SQL scripts for schema migration.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Assignment submission deadline in ISO format',
    type: 'string',
    example: '2026-12-31T23:59:59.000Z',
  })
  @IsOptional()
  @IsISO8601()
  dueAt?: string;

  @ApiPropertyOptional({
    description: 'Maximum achievable score',
    type: 'number',
    example: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxScore?: number;

  @ApiPropertyOptional({
    description: 'Topic UUID this assignment is attached to',
    type: 'string',
    example: 'a0000000-0000-0000-0000-000000000001',
    nullable: true,
  })
  @IsOptional()
  @ValidateIf(
    (_, value) => value !== null && value !== undefined && value !== '',
  )
  @IsUUID()
  topicId?: string | null;

  @ApiPropertyOptional({
    description: 'Attached assignment instruction materials',
    type: () => [AssignmentMaterialDto],
    example: [{ fileUrl: 'materials/guideline.pdf', fileType: 'pdf' }],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssignmentMaterialDto)
  materials?: AssignmentMaterialDto[];
}
