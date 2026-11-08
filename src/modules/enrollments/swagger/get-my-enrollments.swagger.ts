import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';
import { EnrollmentStatus } from 'src/generated/prisma/enums';

export function ApiGetMyEnrollments() {
  return applyDecorators(
    ApiOperation({ summary: 'Get all enrolled classes for current user' }),
    ApiAuth(),
    ApiQuery({
      name: 'status',
      required: false,
      enum: EnrollmentStatus,
      description: 'Filter by enrollment status (e.g. approved, pending)',
    }),
    ApiQuery({
      name: 'isStarred',
      required: false,
      type: Boolean,
      description: 'Filter by starred favorite state',
    }),
    ApiQuery({
      name: 'search',
      required: false,
      type: String,
      description: 'Search keyword matching class title, subject or teacher',
    }),
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      description: 'Page index number',
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      description: 'Number of records per page',
    }),
    ApiOkResponse({
      description: 'Paginated list of enrolled classes',
      schema: {
        example: {
          success: true,
          message: 'Get my enrollments successful',
          data: {
            data: [
              {
                id: 'class-uuid',
                title: 'Data Structures and Algorithms',
                subject: 'Computer Science',
                description: 'Core fundamental algorithms and data structures',
                courseCode: 'IT003',
                semester: '2026-1',
                isPrivate: false,
                teacher: {
                  id: 'teacher-uuid',
                  fullName: 'Nguyen Van A',
                  email: 'vana@example.com',
                  avatarUrl: 'https://example.com/avatar.jpg',
                  role: 'teacher',
                },
                enrollment: {
                  id: 'enrollment-uuid',
                  status: 'approved',
                  isStarred: true,
                  roleIn: 'student',
                  joinedAt: '2026-03-19T10:00:00.000Z',
                },
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
      },
    }),
  );
}
