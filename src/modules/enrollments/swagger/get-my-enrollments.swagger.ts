import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';
import { Enrollment } from '../entities/enrollment.entity';

export function ApiGetMyEnrollments() {
  return applyDecorators(
    ApiOperation({ summary: 'Get all my enrollments' }),
    ApiAuth(),
    ApiOkResponse({
      description: 'Get all enrollments successful',
      type: [Enrollment],
    }),
  );
}
