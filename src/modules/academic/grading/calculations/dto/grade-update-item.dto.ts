import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsUUID, Max, Min } from 'class-validator';

export class GradeUpdateItemDto {
  @ApiProperty({
    description: 'Student UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: 'string',
  })
  @IsUUID()
  studentId!: string;

  @ApiProperty({
    description: 'Grade category UUID',
    example: '123e4567-e89b-12d3-a456-426614174001',
    type: 'string',
  })
  @IsUUID()
  categoryId!: string;

  @ApiProperty({
    description: 'Score value on scale 0 to 10',
    example: 8.5,
    type: 'number',
  })
  @IsNumber()
  @Min(0)
  @Max(10)
  score!: number;
}
