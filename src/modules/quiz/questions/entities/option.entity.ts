import { ApiProperty } from '@nestjs/swagger';

export class OptionEntity {
  @ApiProperty({
    description: 'Unique identifier of option',
    example: '55555555-5555-5555-5555-555555555555',
    type: 'string',
  })
  id!: string;

  @ApiProperty({
    description: 'Content of the option',
    example: 'Application Layer',
    type: 'string',
  })
  content!: string;

  @ApiProperty({
    description: 'Indicates if this option is correct',
    example: true,
    type: 'boolean',
  })
  isCorrect!: boolean;

  @ApiProperty({
    description: 'Question ID that this option belongs to',
    example: '33333333-3333-3333-3333-333333333333',
    type: 'string',
  })
  questionId!: string;
}
