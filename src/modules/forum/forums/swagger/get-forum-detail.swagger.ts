import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam } from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';
import { ForumEntity } from '../entities/forum.entity';

export function ApiGetForumDetail() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get details of a discussion topic with nested comments',
    }),
    ApiAuth(),
    ApiParam({
      name: 'forumId',
      type: String,
      description: 'Forum discussion unique identifier',
    }),
    ApiOkResponse({
      description: 'Forum topic details retrieved successfully',
      type: ForumEntity,
    }),
  );
}
