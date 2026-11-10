import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam } from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';

export function ApiDeleteSubmission() {
  return applyDecorators(
    ApiOperation({ summary: 'Cancel/un-submit a student submission' }),
    ApiAuth(),
    ApiParam({
      name: 'id',
      description: 'UUID of the submission to cancel',
      type: 'string',
    }),
    ApiOkResponse({
      description: 'Submission cancelled successfully',
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Cancel submission successful' },
        },
      },
    }),
  );
}
