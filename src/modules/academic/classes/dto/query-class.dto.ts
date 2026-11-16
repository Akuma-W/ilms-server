import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';
import { QueryDto } from 'src/common/dto/query.dto';

export class QueryClassDto extends QueryDto {
  @ApiPropertyOptional({
    description: 'Filter classes by archived status',
    type: 'boolean',
    example: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean()
  isArchived?: boolean;

  @ApiPropertyOptional({
    description: 'Filter classes by subject ID',
    type: 'string',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID('4')
  subjectId?: string;
}
