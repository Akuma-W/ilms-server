import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class AddAssistantDto {
  @ApiProperty({
    description: 'User ID of the assistant teacher to add',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: 'string',
  })
  @IsUUID('4')
  @IsNotEmpty()
  userId!: string;
}
