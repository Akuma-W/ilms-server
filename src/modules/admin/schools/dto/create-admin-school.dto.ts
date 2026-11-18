import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { SchoolStatus } from 'src/generated/prisma/enums';

export class CreateAdminSchoolDto {
  @ApiProperty({
    description: 'Full school name',
    example: 'Đại học Khoa học Tự nhiên',
    type: 'string',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({
    description: 'Unique school code/shortname',
    example: 'HCMUS',
    type: 'string',
  })
  @IsOptional()
  @IsString()
  shortname?: string;

  @ApiPropertyOptional({
    description: 'Street address of the institution',
    example: '227 Nguyễn Văn Cừ, Quận 5',
    type: 'string',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    description: 'City or province name',
    example: 'Hồ Chí Minh',
    type: 'string',
  })
  @IsString()
  @IsNotEmpty()
  city!: string;

  @ApiPropertyOptional({
    description: 'Initial school lifecycle status',
    example: SchoolStatus.active,
    enum: SchoolStatus,
    type: 'string',
  })
  @IsOptional()
  @IsEnum(SchoolStatus)
  status?: SchoolStatus;
}
