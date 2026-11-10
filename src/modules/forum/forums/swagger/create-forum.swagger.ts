import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';
import { CreateForumDto } from '../dto/create-forum.dto';
import { ForumEntity } from '../entities/forum.entity';

export function ApiCreateForum() {
  return applyDecorators(
    ApiOperation({ summary: 'Create new discussion topic in a classroom' }),
    ApiAuth(),
    ApiParam({
      name: 'classId',
      type: String,
      description: 'Classroom unique identifier',
    }),
    ApiBody({ type: CreateForumDto }),
    ApiCreatedResponse({
      description: 'Discussion topic created successfully',
      type: ForumEntity,
    }),
  );
}
