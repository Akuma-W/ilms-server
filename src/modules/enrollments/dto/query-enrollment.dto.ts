import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
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
}
