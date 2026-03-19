import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';
import { Topic } from '../entities/topic.entity';

export function ApiGetTopics() {
  return applyDecorators(
    ApiOperation({ summary: 'Get all topics in class' }),
    ApiAuth(),
    ApiOkResponse({
      description: 'Danh sách topic',
      type: [Topic],
    }),
  );
}
