import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';

export function ApiRejectEnrollment() {
  return applyDecorators(
    ApiOperation({ summary: 'Reject user to join class' }),
    ApiAuth(),
    ApiOkResponse({
      description: 'Reject enrollment successful',
    }),
  );
}
