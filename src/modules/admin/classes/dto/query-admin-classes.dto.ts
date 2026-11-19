import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';
import { QueryDto } from 'src/common/dto/query.dto';

export class QueryAdminClassesDto extends QueryDto {
  @ApiPropertyOptional({
    description: 'Filter classes by affiliated school UUID',
    example: 'a0000000-0000-0000-0000-000000000001',
    type: 'string',
  })
  @IsOptional()
  @IsUUID('4')
  schoolId?: string;

  @ApiPropertyOptional({
    description: 'Filter classes by associated subject UUID',
    example: 's0000000-0000-0000-0000-000000000001',
    type: 'string',
  })
  @IsOptional()
  @IsUUID('4')
  subjectId?: string;

  @ApiPropertyOptional({
    description: 'Filter classes by archived lifecycle state',
    example: false,
    type: 'boolean',
  })
  @IsOptional()
  @Transform(
    ({ value, obj }: { value: unknown; obj?: Record<string, unknown> }) => {
      const rawVal = obj?.isArchived ?? value;
      if (rawVal === 'true' || rawVal === true) return true;
      if (rawVal === 'false' || rawVal === false) return false;
      return undefined;
    },
  )
  @IsBoolean()
  isArchived?: boolean;
}
