import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam } from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';
import { ClassMember } from '../entities/class-member.entity';

export function ApiGetClassMembers() {
  return applyDecorators(
    ApiOperation({
      summary:
        'Get all members of a class (teachers, assistants, students, pending)',
    }),
    ApiAuth(),
    ApiParam({
      name: 'classId',
      description: 'Class UUID identifier',
      type: 'string',
    }),
    ApiOkResponse({
      description: 'List of members in the class',
      type: [ClassMember],
      schema: {
        example: {
          success: true,
          message: 'Get class members successful',
          data: [
            {
              id: 'owner-class-uuid',
              userId: 'teacher-uuid',
              user: {
                id: 'teacher-uuid',
                fullName: 'ThS. Nguyen Van A',
                email: 'vana@uit.edu.vn',
                avatarUrl: 'https://example.com/avatar.jpg',
                identityCode: 'GV0001',
                role: 'teacher',
              },
              role: 'teacher',
              status: 'approved',
              joinedAt: '2026-02-10T08:00:00.000Z',
              studentCode: 'GV0001',
            },
            {
              id: 'enrollment-uuid',
              userId: 'student-uuid',
              user: {
                id: 'student-uuid',
                fullName: 'Tran Thi B',
                email: 'thib@uit.edu.vn',
                avatarUrl: null,
                identityCode: '21520001',
                role: 'student',
              },
              role: 'student',
              status: 'approved',
              joinedAt: '2026-02-15T10:00:00.000Z',
              studentCode: '21520001',
            },
          ],
        },
      },
    }),
  );
}
