import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';
import { Topic } from '../entities/topic.entity';

export function ApiSearchTopic() {
  return applyDecorators(
    ApiOperation({ summary: 'Search topic by title' }),
    ApiAuth(),
    ApiOkResponse({
      description: 'Topic tìm được',
      type: [Topic],
    }),
  );
}
