import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiOkResponse } from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';

export function ApiGetClasses() {
  return applyDecorators(
    ApiOperation({ summary: 'Get list of classes (all roles)' }),
    ApiAuth(),
    ApiQuery({ name: 'keyword', required: false }),
    ApiQuery({ name: 'page', required: false, type: Number }),
    ApiQuery({ name: 'limit', required: false, type: Number }),
    ApiOkResponse({
      description: 'Paginated list of classes',
      schema: {
        example: {
          data: [
            {
              id: 'uuid',
              title: 'Math 101',
              subject: 'Mathematics',
              description: 'Introductory math',
              semester: '2026-1',
              courseCode: 'ABC123',
              isPrivate: false,
              teacher: { id: 'uuid', fullName: 'John Doe' },
              createdAt: '2026-03-18T08:00:00.000Z',
            },
          ],
          meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
        },
      },
    }),
  );
}
