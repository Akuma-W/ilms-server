import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class QuerySubjectDto {
  @ApiPropertyOptional({
    description: 'Filter by school ID (admin only)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: 'string',
  })
  @IsUUID('4')
  @IsOptional()
  schoolId?: string;

  @ApiPropertyOptional({
    description: 'Keyword search in subject code or name',
    example: 'lập trình',
    type: 'string',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by active status',
    example: true,
    type: 'boolean',
  })
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    type: 'number',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 20,
    type: 'number',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 20;
}
