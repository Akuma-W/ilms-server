import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiOkResponse, ApiBody } from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';
import { CreateTopicDto } from '../dto/create-topic.dto';
import { Topic } from '../entities/topic.entity';

export function ApiCreateTopic() {
  return applyDecorators(
    ApiOperation({ summary: 'Create topic in class' }),
    ApiAuth(),
    ApiBody({ type: CreateTopicDto }),
    ApiOkResponse({
      description: 'Tạo topic thành công',
      type: Topic,
    }),
  );
}
