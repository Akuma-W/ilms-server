import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam } from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';

export function ApiUnbanMember() {
  return applyDecorators(
    ApiOperation({ summary: 'Lift suspension / unban a class member' }),
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
      description: 'Member suspension lifted successfully',
      schema: {
        example: {
          success: true,
          message: 'Member suspension lifted successfully',
          data: {
            id: 'uuid',
            status: 'approved',
          },
        },
      },
    }),
  );
}
