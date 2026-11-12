import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class CreateOptionDto {
  @ApiProperty({
    description: 'Content of the answer option',
    example: 'Application Layer',
    type: 'string',
  })
  @IsString()
  @IsNotEmpty()
  content!: string;

  @ApiProperty({
    description: 'Whether this option is a correct answer',
    example: true,
    type: 'boolean',
  })
  @IsBoolean()
  isCorrect!: boolean;
}
