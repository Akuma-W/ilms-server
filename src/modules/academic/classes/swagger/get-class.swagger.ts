import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';

export function ApiGetClass() {
  return applyDecorators(
    ApiOperation({ summary: 'Get a single class by id' }),
    ApiAuth(),
    ApiOkResponse({
      description: 'Class detail',
      schema: {
        example: {
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
      },
    }),
  );
}
