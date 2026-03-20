import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';

export function ApiApproveEnrollment() {
  return applyDecorators(
    ApiOperation({ summary: 'Approve user to join class' }),
    ApiAuth(),
    ApiOkResponse({
      description: 'Approve enrollment successful',
    }),
  );
}
