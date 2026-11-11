import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateReferenceDto {
  @ApiProperty({
    description: 'Title of the reference document or link',
    example: 'Clean Code: A Handbook of Agile Software Craftsmanship',
    type: 'string',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'URL of the reference link or stored file',
    example: 'https://example.com/books/clean-code.pdf',
    type: 'string',
  })
  @IsString()
  @IsNotEmpty()
  url: string;

  @ApiPropertyOptional({
    description: 'Brief overview or note about the reference',
    example: 'Recommended reading for software architecture design principles',
    type: 'string',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
