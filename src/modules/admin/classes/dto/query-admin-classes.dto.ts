import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';
import { ToBoolean } from 'src/common/decorators/to-boolean.decorator';
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
  @ToBoolean()
  @IsBoolean()
  isArchived?: boolean;
}
