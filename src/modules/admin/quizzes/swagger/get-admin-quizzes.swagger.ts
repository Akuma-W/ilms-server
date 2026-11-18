import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdminQuizEntity } from '../entities/admin-quiz.entity';

export function ApiGetAdminQuizzes() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get paginated list of all quizzes across platform',
      description:
        'Lists all public and private quizzes with creator, questions, and attempt counters for administrator',
    }),
    ApiOkResponse({
      description: 'Paginated quiz items and telemetry',
      type: [AdminQuizEntity],
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Forbidden' }),
  );
}
