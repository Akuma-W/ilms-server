import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { FileType } from 'src/generated/prisma/enums';

export class SubmissionFileDto {
  @ApiProperty({
    description: 'Storage URL or key of the submitted file',
    type: 'string',
    example: 'submissions/homework.pdf',
  })
  @IsString()
  @IsNotEmpty()
  fileUrl: string;

  @ApiPropertyOptional({
    description: 'Format type of the submitted file',
    type: 'string',
    enum: FileType,
    example: 'pdf',
  })
  @IsOptional()
  @IsEnum(FileType)
  fileType?: FileType;

  @ApiPropertyOptional({
    description: 'Original name of the submitted file',
    type: 'string',
    example: 'homework.pdf',
  })
  @IsOptional()
  @IsString()
  fileName?: string;

  @ApiPropertyOptional({
    description: 'Size of file in bytes',
    type: 'number',
    example: 204800,
  })
  @IsOptional()
  @IsNumber()
  fileSize?: number;
}

export class SubmitAssignmentDto {
  @ApiPropertyOptional({
    description: 'Text solution or answers provided by student',
    type: 'string',
    example: 'Here is my complete solution for the assignment...',
  })
  @IsOptional()
  @IsString()
  textAnswer?: string;

  @ApiPropertyOptional({
    description: 'Uploaded attachment files',
    type: () => [SubmissionFileDto],
    example: [{ fileUrl: 'submissions/homework.pdf', fileType: 'pdf' }],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubmissionFileDto)
  files?: SubmissionFileDto[];
}
