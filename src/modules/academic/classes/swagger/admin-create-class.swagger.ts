import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiBody, ApiOkResponse } from '@nestjs/swagger';
import { AdminCreateClassDto } from '../dto/admin-create-class.dto';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';

export function ApiAdminCreateClass() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create a class on behalf of any school/teacher (admin only)',
    }),
    ApiAuth(),
    ApiBody({ type: AdminCreateClassDto }),
    ApiOkResponse({
      description: 'Class created by administrator successfully',
      schema: {
        example: {
          id: 'uuid',
          title: 'Math 101',
          subject: 'Mathematics',
          description: 'Introductory math',
          semester: '2026-1',
          courseCode: 'ABC123',
          isPrivate: false,
          schoolId: 'school-uuid',
          teacherId: 'teacher-uuid',
          createdAt: '2026-03-18T08:00:00.000Z',
        },
      },
    }),
  );
}
