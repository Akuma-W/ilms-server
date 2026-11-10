import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';

export function ApiDeleteClass() {
  return applyDecorators(
    ApiOperation({ summary: 'Delete a class (admin or teacher of class)' }),
    ApiAuth(),
    ApiOkResponse({
      description: 'Class deleted successfully',
      schema: { example: { message: 'Class deleted successfully' } },
    }),
  );
}
