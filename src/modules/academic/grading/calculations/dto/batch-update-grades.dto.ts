import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { GradeUpdateItemDto } from './grade-update-item.dto';

export class BatchUpdateGradesDto {
  @ApiProperty({
    description: 'List of student grade score updates',
    type: [GradeUpdateItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GradeUpdateItemDto)
  updates!: GradeUpdateItemDto[];
}
