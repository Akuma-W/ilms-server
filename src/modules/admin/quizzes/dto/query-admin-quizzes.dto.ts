import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { QueryDto } from 'src/common/dto/query.dto';
import { QuizStatus, Visibility } from 'src/generated/prisma/enums';

export class QueryAdminQuizzesDto extends QueryDto {
  @ApiPropertyOptional({
    description: 'Filter quizzes by publishing status',
    example: QuizStatus.published,
    enum: QuizStatus,
    type: 'string',
  })
  @IsOptional()
  @IsEnum(QuizStatus)
  status?: QuizStatus;

  @ApiPropertyOptional({
    description: 'Filter quizzes by visibility scope',
    example: Visibility.public,
    enum: Visibility,
    type: 'string',
  })
  @IsOptional()
  @IsEnum(Visibility)
  visibility?: Visibility;
}
