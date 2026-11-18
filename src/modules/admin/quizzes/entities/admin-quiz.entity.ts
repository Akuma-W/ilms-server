import { ApiProperty } from '@nestjs/swagger';
import { QuizStatus, ReviewMode, Visibility } from 'src/generated/prisma/enums';
import { GeneralUserEntity } from '../../entities/general-user.entity';

export class AdminQuizEntity {
  @ApiProperty({
    description: 'Quiz UUID identifier',
    example: 'q0000000-0000-0000-0000-000000000001',
    type: 'string',
  })
  id!: string;

  @ApiProperty({
    description: 'Quiz formal title',
    example: 'Kiểm tra Kiến trúc Máy tính giữa kỳ',
    type: 'string',
  })
  title!: string;

  @ApiProperty({
    description: 'Quiz brief description',
    example: 'Đề thi trắc nghiệm 30 câu',
    type: 'string',
    nullable: true,
  })
  description!: string | null;

  @ApiProperty({
    description: 'Duration limit in minutes',
    example: 45,
    type: 'number',
  })
  timeLimit!: number;

  @ApiProperty({
    description: 'Visibility scope',
    example: Visibility.public,
    enum: Visibility,
    type: 'string',
  })
  visibility!: Visibility;

  @ApiProperty({
    description: 'Publishing state',
    example: QuizStatus.published,
    enum: QuizStatus,
    type: 'string',
  })
  status!: QuizStatus;

  @ApiProperty({
    description: 'Review mode policy',
    example: ReviewMode.after_submission,
    enum: ReviewMode,
    type: 'string',
  })
  reviewMode!: ReviewMode;

  @ApiProperty({
    description: 'Total question items count',
    example: 30,
    type: 'number',
  })
  totalQuestions!: number;

  @ApiProperty({
    description: 'Total student attempt submissions',
    example: 185,
    type: 'number',
  })
  totalAttempts!: number;

  @ApiProperty({
    description: 'Author profile record',
    type: () => GeneralUserEntity,
  })
  creator!: GeneralUserEntity;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2026-11-01T08:00:00.000Z',
    type: 'string',
    nullable: true,
  })
  createdAt!: Date | null;

  @ApiProperty({
    description: 'Last updated timestamp',
    example: '2026-11-17T09:00:00.000Z',
    type: 'string',
    nullable: true,
  })
  updatedAt!: Date | null;
}
