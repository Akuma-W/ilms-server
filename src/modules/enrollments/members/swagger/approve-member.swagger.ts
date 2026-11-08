import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam } from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';

export function ApiApproveMember() {
  return applyDecorators(
    ApiOperation({ summary: 'Approve a pending student enrollment' }),
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
      description: 'Enrollment approved successfully',
      schema: {
        example: {
          success: true,
          message: 'Approve enrollment successful',
          data: {
            id: 'uuid',
            status: 'approved',
          },
        },
      },
    }),
  );
}
