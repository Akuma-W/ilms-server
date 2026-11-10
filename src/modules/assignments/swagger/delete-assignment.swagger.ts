import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam } from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';

export function ApiDeleteAssignment() {
  return applyDecorators(
    ApiOperation({ summary: 'Delete assignment by ID' }),
    ApiAuth(),
    ApiParam({
      name: 'id',
      description: 'UUID of the assignment to delete',
      type: 'string',
    }),
    ApiOkResponse({
      description: 'Assignment deleted successfully',
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Delete assignment successful' },
        },
      },
    }),
  );
}
