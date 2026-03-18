import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiBody, ApiOkResponse } from '@nestjs/swagger';
import { CreateClassDto } from '../dto/create-class.dto';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';

export function ApiCreateClass() {
  return applyDecorators(
    ApiOperation({ summary: 'Create a class (teacher/admin only)' }),
    ApiAuth(),
    ApiBody({ type: CreateClassDto }),
    ApiOkResponse({
      description: 'Class created successfully',
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
