import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';
import { ReferenceEntity } from '../entities/reference.entity';

export function ApiGetReference() {
  return applyDecorators(
    ApiOperation({ summary: 'Get details of a specific reference' }),
    ApiAuth(),
    ApiOkResponse({
      description: 'Reference details',
      type: ReferenceEntity,
    }),
  );
}
