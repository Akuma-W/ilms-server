import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';
import { UpdateAssignmentDto } from '../dto/update-assignment.dto';
import { AssignmentEntity } from '../entities/assignment.entity';

export function ApiUpdateAssignment() {
  return applyDecorators(
    ApiOperation({ summary: 'Update assignment by ID' }),
    ApiAuth(),
    ApiParam({
      name: 'id',
      description: 'UUID of the assignment',
      type: 'string',
    }),
    ApiBody({ type: UpdateAssignmentDto }),
    ApiOkResponse({
      description: 'Assignment updated successfully',
      type: AssignmentEntity,
    }),
  );
}
