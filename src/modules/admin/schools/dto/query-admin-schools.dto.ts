import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { QueryDto } from 'src/common/dto/query.dto';
import { SchoolStatus } from 'src/generated/prisma/enums';

export class QueryAdminSchoolsDto extends QueryDto {
  @ApiPropertyOptional({
    description: 'Filter schools by operational status',
    example: SchoolStatus.active,
    enum: SchoolStatus,
    type: 'string',
  })
  @IsOptional()
  @IsEnum(SchoolStatus)
  status?: SchoolStatus;
}
