import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam } from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';

export function ApiGetClassRelation() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get current user relation and enrollment status in a class',
    }),
    ApiAuth(),
    ApiParam({
      name: 'classId',
      description: 'Class UUID identifier',
      type: 'string',
    }),
    ApiOkResponse({
      description: 'Current user enrollment details or null if not enrolled',
      schema: {
        example: {
          success: true,
          message: 'Get class relation success',
          data: {
            id: 'enrollment-uuid',
            userId: 'user-uuid',
            classId: 'class-uuid',
            roleIn: 'student',
            status: 'approved',
            isStarred: true,
            joinedAt: '2026-03-19T10:00:00.000Z',
          },
        },
      },
    }),
  );
}
