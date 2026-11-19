import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';

export function ApiSyncGrades() {
  return applyDecorators(
    ApiOperation({
      summary:
        'Automatically synchronize grades from assignments, quizzes, and attendance',
    }),
    ApiAuth(),
    ApiOkResponse({
      description: 'Grades synchronized successfully',
      schema: {
        example: {
          success: true,
          message: 'Grades synchronized successfully',
          data: {
            syncedCategories: 3,
            totalGradesUpdated: 45,
          },
        },
      },
    }),
  );
}
