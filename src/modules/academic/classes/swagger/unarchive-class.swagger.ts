import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';

export function ApiUnarchiveClass() {
  return applyDecorators(
    ApiOperation({ summary: 'Unarchive a class and restore active status' }),
    ApiAuth(),
    ApiOkResponse({
      description: 'Class unarchived successfully',
      schema: { example: { message: 'Class unarchived successfully' } },
    }),
  );
}
