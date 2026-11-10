import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam } from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';
import { AssignmentEntity } from '../entities/assignment.entity';

export function ApiGetClassAssignments() {
  return applyDecorators(
    ApiOperation({ summary: 'Get all assignments for a class' }),
    ApiAuth(),
    ApiParam({
      name: 'classId',
      description: 'UUID of the class',
      type: 'string',
    }),
    ApiOkResponse({
      description: 'List of assignments retrieved successfully',
      type: [AssignmentEntity],
    }),
  );
}
