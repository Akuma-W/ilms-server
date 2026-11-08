import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';
import { UpdateMemberRoleDto } from '../dto/update-member-role.dto';

export function ApiUpdateMemberRole() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update a member role (teaching assistant / student)',
    }),
    ApiAuth(),
    ApiParam({
      name: 'classId',
      description: 'Class UUID identifier',
      type: 'string',
    }),
    ApiParam({
      name: 'memberId',
      description: 'Enrollment ID or User ID',
      type: 'string',
    }),
    ApiBody({ type: UpdateMemberRoleDto }),
    ApiOkResponse({
      description: 'Member role updated successfully',
      schema: {
        example: {
          success: true,
          message: 'Update member role successful',
          data: {
            id: 'uuid',
            roleIn: 'teacher',
          },
        },
      },
    }),
  );
}
