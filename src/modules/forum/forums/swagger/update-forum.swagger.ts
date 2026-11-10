import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';
import { UpdateForumDto } from '../dto/update-forum.dto';
import { ForumEntity } from '../entities/forum.entity';

export function ApiUpdateForum() {
  return applyDecorators(
    ApiOperation({ summary: 'Update an existing discussion topic' }),
    ApiAuth(),
    ApiParam({
      name: 'forumId',
      type: String,
      description: 'Forum discussion unique identifier',
    }),
    ApiBody({ type: UpdateForumDto }),
    ApiOkResponse({
      description: 'Discussion topic updated successfully',
      type: ForumEntity,
    }),
  );
}
