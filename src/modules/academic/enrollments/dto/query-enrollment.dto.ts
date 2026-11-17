import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { QueryDto } from 'src/common/dto/query.dto';
import { EnrollmentStatus } from 'src/generated/prisma/enums';

export class QueryEnrollmentDto extends QueryDto {
  @ApiPropertyOptional({
    description: 'Status of enrollment',
    type: 'string',
    example: EnrollmentStatus.approved,
    enum: EnrollmentStatus,
  })
  @IsOptional()
  @IsEnum(EnrollmentStatus)
  status?: EnrollmentStatus;

  @ApiPropertyOptional({
    description: 'Mark the class with a star',
    type: 'boolean',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isStarred?: boolean;

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
