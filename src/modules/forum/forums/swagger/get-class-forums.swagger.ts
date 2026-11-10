import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';
import { ForumEntity } from '../entities/forum.entity';
import { ForumTabFilter } from '../dto/query-forum.dto';

export function ApiGetClassForums() {
  return applyDecorators(
    ApiOperation({ summary: 'Get list of discussion topics in a classroom' }),
    ApiAuth(),
    ApiQuery({
      name: 'tab',
      required: false,
      enum: ForumTabFilter,
      description: 'Filter discussion topics by tab',
    }),
    ApiQuery({
      name: 'search',
      required: false,
      type: String,
      description: 'Search keyword matching title or content',
    }),
    ApiOkResponse({
      description: 'List of discussion topics retrieved successfully',
      type: [ForumEntity],
    }),
  );
}
