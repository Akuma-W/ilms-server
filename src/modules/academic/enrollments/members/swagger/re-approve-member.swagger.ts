import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam } from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';

export function ApiReApproveMember() {
  return applyDecorators(
    ApiOperation({ summary: 'Re-approve a previously rejected enrollment' }),
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
      description: 'Enrollment re-approved successfully',
      schema: {
        example: {
          success: true,
          message: 'Member re-approved successfully',
          data: {
            id: 'uuid',
            status: 'approved',
          },
        },
      },
    }),
  );
}
