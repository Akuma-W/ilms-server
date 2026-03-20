import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';
import { Enrollment } from '../entities/enrollment.entity';

export function ApiUpdateEnrollment() {
  return applyDecorators(
    ApiOperation({ summary: 'Update enrollment (teacher)' }),
    ApiAuth(),
    ApiOkResponse({
      description: 'Update enrollment successful',
      type: Enrollment,
    }),
  );
}
