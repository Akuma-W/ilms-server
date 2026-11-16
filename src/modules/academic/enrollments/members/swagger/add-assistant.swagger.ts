import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';
import { AddAssistantDto } from '../dto/add-assistant.dto';

export function ApiAddAssistant() {
  return applyDecorators(
    ApiOperation({
      summary:
        'Add an assistant teacher / co-teacher to the class (Head teacher or Admin)',
    }),
    ApiAuth(),
    ApiParam({ name: 'classId', type: 'string', description: 'Class UUID' }),
    ApiBody({ type: AddAssistantDto }),
    ApiOkResponse({
      description: 'Assistant teacher added successfully',
      schema: {
        example: {
          message: 'Assistant teacher added successfully',
          data: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            classId: '123e4567-e89b-12d3-a456-426614174001',
            userId: '123e4567-e89b-12d3-a456-426614174002',
            roleIn: 'teacher',
            status: 'approved',
          },
        },
      },
    }),
  );
}
