import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
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
}
