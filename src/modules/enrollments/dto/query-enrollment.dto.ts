import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { EnrollmentStatus } from 'src/generated/prisma/enums';

export class QueryEnrollmentDto {
  @ApiPropertyOptional({
    description: 'Status of enrollment',
    enum: EnrollmentStatus,
    default: EnrollmentStatus.pending,
  })
  @IsOptional()
  @IsEnum(EnrollmentStatus)
  status?: EnrollmentStatus;

  @ApiPropertyOptional({
    description: 'Mark the class with a star',
    type: 'boolean',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isStarred?: boolean;
}
