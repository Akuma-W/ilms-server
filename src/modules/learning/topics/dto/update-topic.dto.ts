import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateTopicDto } from './create-topic.dto';
import { IsInt, IsOptional } from 'class-validator';

export class UpdateTopicDto extends PartialType(CreateTopicDto) {
  @ApiPropertyOptional({
    description: 'Display order index',
    type: 'number',
    example: 2,
  })
  @IsOptional()
  @IsInt()
  orderIndex?: number;
}
