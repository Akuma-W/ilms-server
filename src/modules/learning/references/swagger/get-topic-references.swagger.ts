import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';
import { ReferenceEntity } from '../entities/reference.entity';

export function ApiGetTopicReferences() {
  return applyDecorators(
    ApiOperation({ summary: 'Get all references under a topic' }),
    ApiAuth(),
    ApiOkResponse({
      description: 'List of references under the topic',
      type: [ReferenceEntity],
    }),
  );
}
