import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiOkResponse } from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';

export function ApiGetMyTeachingClasses() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get classes created by current teacher',
    }),
    ApiAuth(),
    ApiQuery({ name: 'keyword', required: false }),
    ApiQuery({ name: 'page', required: false, type: Number }),
    ApiQuery({ name: 'limit', required: false, type: Number }),
    ApiOkResponse({
      description: 'List of classes created by teacher',
      schema: {
        example: {
          data: [
            {
              id: 'uuid',
              title: 'Lập trình Web với NestJS',
              subject: 'SE347',
              description: 'Khóa học backend',
              semester: 'Fall 2026',
              courseCode: 'ABC123',
              isPrivate: false,
              teacher: {
                id: 'teacher-uuid',
                fullName: 'Nguyễn Văn A',
              },
              createdAt: '2026-03-18T08:00:00.000Z',
            },
          ],
          meta: {
            page: 1,
            limit: 10,
            total: 1,
            totalPages: 1,
          },
        },
      },
    }),
  );
}
