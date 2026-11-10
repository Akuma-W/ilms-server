import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { FileType } from 'src/generated/prisma/enums';

export class CreateMaterialDto {
  @ApiProperty({
    description: 'Title of learning material',
    type: 'string',
    example: 'Slide Chapter 1: Client-Server Architecture',
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Material format type',
    type: 'string',
    enum: FileType,
    example: 'slide',
  })
  @IsEnum(FileType)
  materialType: FileType;

  @ApiPropertyOptional({
    description: 'Storage file path',
    type: 'string',
    example: 'uploads/materials/slide-chapter-1.pdf',
  })
  @IsOptional()
  @IsString()
  fileUrl?: string;

  @ApiPropertyOptional({
    description: 'External link URL if material is a link',
    type: 'string',
    example: 'https://youtube.com/...',
  })
  @IsOptional()
  @IsString()
  externalUrl?: string;
}
