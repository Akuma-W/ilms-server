import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class TrackMaterialProgressDto {
  @ApiPropertyOptional({
    description: 'Completion status of the learning material',
    example: true,
    type: 'boolean',
  })
  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;
}
