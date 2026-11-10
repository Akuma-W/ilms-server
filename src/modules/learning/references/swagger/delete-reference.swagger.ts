import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';

export function ApiDeleteReference() {
  return applyDecorators(
    ApiOperation({ summary: 'Delete a reference document or link' }),
    ApiAuth(),
    ApiOkResponse({
      description: 'Reference deleted successfully',
      schema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'Delete reference successful',
          },
        },
      },
    }),
  );
}
