import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class CloseMeetingDto {
  @ApiPropertyOptional({
    description:
      'Video recording URL for asynchronous review (YouTube, Google Drive or CDN)',
    example: 'https://drive.google.com/file/d/sample-recording-id/view',
    type: 'string',
  })
  @IsOptional()
  @IsString()
  @IsUrl()
  @MaxLength(500)
  recordingUrl?: string;
}
