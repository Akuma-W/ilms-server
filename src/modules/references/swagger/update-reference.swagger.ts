import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';
import { UpdateReferenceDto } from '../dto/update-reference.dto';
import { ReferenceEntity } from '../entities/reference.entity';

export function ApiUpdateReference() {
  return applyDecorators(
    ApiOperation({ summary: 'Update reference document or link' }),
    ApiAuth(),
    ApiBody({ type: UpdateReferenceDto }),
    ApiOkResponse({
      description: 'Reference updated successfully',
      type: ReferenceEntity,
    }),
  );
}
