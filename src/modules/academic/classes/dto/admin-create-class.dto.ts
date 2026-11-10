import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { CreateClassDto } from './create-class.dto';

export class AdminCreateClassDto extends CreateClassDto {
  @ApiProperty({
    description: 'Id of school that class belongs to',
    type: 'string',
    example: '133c7575-1b40-4ba3-9a24-9484964b9a24',
  })
  @IsUUID()
  schoolId: string;

  @ApiProperty({
    description: 'Id of class administrator teacher',
    type: 'string',
    example: '133c7575-1b40-4ba3-9a24-9484964b9a24',
  })
  @IsUUID()
  teacherId: string;
}
