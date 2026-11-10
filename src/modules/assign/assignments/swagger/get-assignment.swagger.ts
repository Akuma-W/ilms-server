import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam } from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';
import { AssignmentEntity } from '../entities/assignment.entity';

export function ApiGetAssignment() {
  return applyDecorators(
    ApiOperation({ summary: 'Get assignment details by ID' }),
    ApiAuth(),
    ApiParam({
      name: 'id',
      description: 'UUID of the assignment',
      type: 'string',
    }),
    ApiOkResponse({
      description: 'Assignment details retrieved successfully',
      type: AssignmentEntity,
    }),
  );
}
