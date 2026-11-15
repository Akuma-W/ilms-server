import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: 'User full name',
    example: 'Nguyen Van A',
    type: 'string',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  fullName?: string;

  @ApiPropertyOptional({
    description: 'Student identification code',
    example: '21120001',
    type: 'string',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  identityCode?: string;
}
