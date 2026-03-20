import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';

export function ApiLeaveClass() {
  return applyDecorators(
    ApiOperation({ summary: 'Leave class' }),
    ApiAuth(),
    ApiOkResponse({
      description: 'Leave class successful',
    }),
  );
}
