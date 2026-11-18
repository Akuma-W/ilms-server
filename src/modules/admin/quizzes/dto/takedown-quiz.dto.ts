import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class TakedownQuizDto {
  @ApiProperty({
    description:
      'Reason for copyright infringement moderation or takedown action',
    example: 'Đề thi sao chép trái phép bản quyền của ĐHQG 2026',
    type: 'string',
  })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}
