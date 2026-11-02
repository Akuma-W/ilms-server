import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { FileType } from 'src/generated/prisma/enums';

export class CreateMaterialDto {
  @ApiProperty({
    description: 'Tiêu đề tài liệu học tập',
    example: 'Slide Chương 1: Kiến trúc Client-Server',
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Định dạng tài liệu',
    enum: FileType,
    example: 'slide',
  })
  @IsEnum(FileType)
  materialType: FileType;

  @ApiPropertyOptional({
    description: 'Đường dẫn tệp tin trên hệ thống storage',
    example: 'uploads/materials/slide-chuong-1.pdf',
  })
  @IsOptional()
  @IsString()
  fileUrl?: string;

  @ApiPropertyOptional({
    description: 'Đường dẫn liên kết ngoài (nếu loại tài liệu là link)',
    example: 'https://youtube.com/...',
  })
  @IsOptional()
  @IsString()
  externalUrl?: string;
}
