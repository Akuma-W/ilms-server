import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiOperation } from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';
import { CreateAssignmentDto } from '../dto/create-assignment.dto';
import { AssignmentEntity } from '../entities/assignment.entity';

export function ApiCreateAssignment() {
  return applyDecorators(
    ApiOperation({ summary: 'Create new assignment in a class' }),
    ApiAuth(),
    ApiBody({ type: CreateAssignmentDto }),
    ApiCreatedResponse({
      description: 'Assignment created successfully',
      type: AssignmentEntity,
    }),
  );
}
