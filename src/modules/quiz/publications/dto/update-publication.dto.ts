import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsDate, IsOptional, IsUUID } from 'class-validator';

export class UpdatePublicationDto {
  @ApiPropertyOptional({
    description: 'Updated topic ID association',
    example: '77777777-7777-7777-7777-777777777777',
    type: 'string',
  })
  @IsOptional()
  @IsUUID()
  topicId?: string;

  @ApiPropertyOptional({
    description: 'Updated opening datetime',
    example: '2026-11-16T08:00:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  openAt?: Date;

  @ApiPropertyOptional({
    description: 'Updated closing datetime',
    example: '2026-11-21T23:59:59.000Z',
    type: 'string',
    format: 'date-time',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  closeAt?: Date;

  @ApiPropertyOptional({
    description: 'Updated public visibility flag',
    example: false,
    type: 'boolean',
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
