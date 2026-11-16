import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';

export function ApiArchiveClass() {
  return applyDecorators(
    ApiOperation({ summary: 'Archive a class into read-only mode' }),
    ApiAuth(),
    ApiOkResponse({
      description: 'Class archived successfully',
      schema: { example: { message: 'Class archived successfully' } },
    }),
  );
}
