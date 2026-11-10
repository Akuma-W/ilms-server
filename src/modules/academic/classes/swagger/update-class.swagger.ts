import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiBody, ApiOkResponse } from '@nestjs/swagger';
import { UpdateClassDto } from '../dto/update-class.dto';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';

export function ApiUpdateClass() {
  return applyDecorators(
    ApiOperation({ summary: 'Update a class (admin or teacher of class)' }),
    ApiAuth(),
    ApiBody({ type: UpdateClassDto }),
    ApiOkResponse({
      description: 'Class updated successfully',
      schema: { example: { message: 'Class updated successfully' } },
    }),
  );
}
