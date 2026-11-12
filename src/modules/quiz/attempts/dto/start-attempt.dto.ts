import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class StartAttemptDto {
  @ApiPropertyOptional({
    description: 'Publication ID if taking quiz within a class instance',
    example: '88888888-8888-8888-8888-888888888888',
    type: 'string',
  })
  @IsOptional()
  @IsUUID()
  publicationId?: string;
}
