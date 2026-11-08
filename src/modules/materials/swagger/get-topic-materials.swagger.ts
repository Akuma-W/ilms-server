import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';
import { MaterialEntity } from '../entities/material.entity';

export function ApiGetTopicMaterials() {
  return applyDecorators(
    ApiOperation({ summary: 'Get all learning materials under a topic' }),
    ApiAuth(),
    ApiOkResponse({
      description: 'List of learning materials under the topic',
      type: [MaterialEntity],
    }),
  );
}
