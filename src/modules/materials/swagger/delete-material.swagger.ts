import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';

export function ApiDeleteMaterial() {
  return applyDecorators(
    ApiOperation({ summary: 'Delete a learning material' }),
    ApiAuth(),
    ApiOkResponse({
      description: 'Material deleted successfully',
      schema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'Delete material successful',
          },
        },
      },
    }),
  );
}
