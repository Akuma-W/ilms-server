import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';
import { MaterialEntity } from '../entities/material.entity';

export function ApiGetMaterial() {
  return applyDecorators(
    ApiOperation({ summary: 'Get details of a learning material' }),
    ApiAuth(),
    ApiOkResponse({
      description: 'Learning material detail',
      type: MaterialEntity,
    }),
  );
}
