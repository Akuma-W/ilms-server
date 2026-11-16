import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam } from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';

export function ApiBanMember() {
  return applyDecorators(
    ApiOperation({ summary: 'Suspend / ban a member from the class' }),
    ApiAuth(),
    ApiParam({
      name: 'classId',
      description: 'Class UUID identifier',
      type: 'string',
    }),
    ApiParam({
      name: 'memberId',
      description: 'Enrollment ID or student User ID',
      type: 'string',
    }),
    ApiOkResponse({
      description: 'Member suspended successfully',
      schema: {
        example: {
          success: true,
          message: 'Member suspended successfully',
          data: {
            id: 'uuid',
            status: 'suspended',
          },
        },
      },
    }),
  );
}
