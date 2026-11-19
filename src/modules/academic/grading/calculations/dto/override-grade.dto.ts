import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class OverrideGradeDto {
  @ApiProperty({
    description: 'Target student UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: 'string',
  })
  @IsUUID('4')
  @IsNotEmpty()
  studentId!: string;

  @ApiProperty({
    description: 'Target grade category UUID',
    example: '123e4567-e89b-12d3-a456-426614174001',
    type: 'string',
  })
  @IsUUID('4')
  @IsNotEmpty()
  categoryId!: string;

  @ApiProperty({
    description: 'Manual override score (0.0 - 10.0)',
    example: 8.5,
    type: 'number',
  })
  @IsNumber()
  @Min(0)
  @Max(10)
  score!: number;

  @ApiPropertyOptional({
    description: 'Reason for grade override or bonus deduction',
    example: 'Added 0.5 bonus points for active class participation',
    type: 'string',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
