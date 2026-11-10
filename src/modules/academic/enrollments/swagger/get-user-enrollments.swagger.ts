import { applyDecorators } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';
import { EnrollmentStatus } from 'src/generated/prisma/enums';

export function ApiGetUserEnrollments() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get all enrolled classes for a specific user (admin only)',
    }),
    ApiAuth(),
    ApiParam({
      name: 'userId',
      description: 'Target user UUID identifier',
      type: 'string',
    }),
    ApiQuery({
      name: 'status',
      required: false,
      enum: EnrollmentStatus,
      description: 'Filter by enrollment status',
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
      description: 'Search keyword matching class title or subject',
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
      description: 'Paginated list of user enrollments',
      schema: {
        example: {
          success: true,
          message: 'Get user enrollments successful',
          data: {
            data: [],
            meta: {
              page: 1,
              limit: 10,
              total: 0,
              totalPages: 1,
            },
          },
        },
      },
    }),
  );
}
