import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class SyncGradesDto {
  @ApiPropertyOptional({
    description:
      'Target grade category ID to synchronize (if omitted, synchronizes all automatic categories)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: 'string',
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;
}
