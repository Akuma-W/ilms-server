import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';

export function ApiGetStarredClasses() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get all starred favorite classes for current user',
    }),
    ApiAuth(),
    ApiOkResponse({
      description: 'List of starred classes with total count',
      schema: {
        example: {
          success: true,
          message: 'Get starred classes success',
          data: {
            classes: [
              {
                id: 'class-uuid',
                title: 'Data Structures and Algorithms',
                subject: 'Computer Science',
                courseCode: 'IT003',
                enrollment: {
                  id: 'enrollment-uuid',
                  status: 'approved',
                  isStarred: true,
                  roleIn: 'student',
                  joinedAt: '2026-03-19T10:00:00.000Z',
                },
              },
            ],
            total: 1,
          },
        },
      },
    }),
  );
}
