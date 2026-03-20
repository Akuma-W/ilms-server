import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiBody, ApiOkResponse } from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';
import { CreateEnrollmentDto } from '../dto/create-enrollment.dto';

export function ApiJoinClass() {
  return applyDecorators(
    ApiOperation({ summary: 'Join class' }),
    ApiAuth(),
    ApiBody({ type: CreateEnrollmentDto }),
    ApiOkResponse({
      description: 'Join class successfully',
      schema: {
        example: {
          success: true,
          message: 'Join class successfully',
          data: {
            id: 'uuid',
            roleIn: 'student',
            status: 'pending',
          },
        },
      },
    }),
  );
}
