import { ApiPropertyOptional } from '@nestjs/swagger';
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
}
