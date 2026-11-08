import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';
import { CreateEnrollmentDto } from '../dto/create-enrollment.dto';

export function ApiJoinClass() {
  return applyDecorators(
    ApiOperation({ summary: 'Join or request enrollment into a class' }),
    ApiAuth(),
    ApiBody({ type: CreateEnrollmentDto }),
    ApiOkResponse({
      description: 'Join class request processed successfully',
      schema: {
        example: {
          success: true,
          message: 'Join class successful',
          data: {
            id: 'enrollment-uuid',
            classId: 'class-uuid',
            userId: 'user-uuid',
            roleIn: 'student',
            status: 'approved',
            isStarred: false,
            joinedAt: '2026-03-19T10:00:00.000Z',
          },
        },
      },
    }),
  );
}
