import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdminQuizEntity } from '../entities/admin-quiz.entity';

export function ApiTakedownAdminQuiz() {
  return applyDecorators(
    ApiOperation({
      summary: 'Moderate and takedown quiz due to copyright violation',
      description:
        'Revokes public visibility and switches quiz to draft private state with logged moderation reason',
    }),
    ApiOkResponse({
      description: 'Quiz successfully un-published and restricted',
      type: AdminQuizEntity,
    }),
    ApiResponse({ status: 404, description: 'Quiz not found' }),
  );
}
