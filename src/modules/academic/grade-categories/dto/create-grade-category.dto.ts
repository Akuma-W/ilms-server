import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateGradeCategoryDto {
  @ApiProperty({
    description: 'Name of the grade category',
    example: 'Chuyên cần',
    type: 'string',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @ApiProperty({
    description:
      'Weight of the grade category (e.g. 0.2 for 20%, 0.3 for 30%, 0.5 for 50%)',
    example: 0.2,
    type: 'number',
  })
  @IsNumber()
  @Min(0.01)
  @Max(1.0)
  weight!: number;

  @ApiPropertyOptional({
    description: 'Display sequence order index of the grade category',
    example: 1,
    type: 'number',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  orderIndex?: number;
}
