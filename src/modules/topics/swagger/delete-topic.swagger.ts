import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';

export function ApiDeleteTopic() {
  return applyDecorators(
    ApiOperation({ summary: 'Delete topic and all resources' }),
    ApiAuth(),
    ApiOkResponse({
      description: 'Xóa thành công',
    }),
  );
}
