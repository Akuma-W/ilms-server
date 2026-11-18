import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiGetAdminQuiz() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get full quiz examination structure for administrative audit',
      description:
        'Retrieves complete question contents, answer keys, explanations, and options without mask',
    }),
    ApiOkResponse({
      description: 'Unmasked quiz examination structure',
    }),
    ApiResponse({ status: 404, description: 'Quiz not found' }),
  );
}
