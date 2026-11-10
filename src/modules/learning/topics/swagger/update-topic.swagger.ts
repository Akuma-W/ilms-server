import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiOkResponse, ApiBody } from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';
import { UpdateTopicDto } from '../dto/update-topic.dto';
import { Topic } from '../entities/topic.entity';

export function ApiUpdateTopic() {
  return applyDecorators(
    ApiOperation({ summary: 'Update topic' }),
    ApiAuth(),
    ApiBody({ type: UpdateTopicDto }),
    ApiOkResponse({
      description: 'Update thành công',
      type: Topic,
    }),
  );
}
