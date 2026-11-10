import {
  Body,
  Controller,
  Delete,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Role } from 'src/generated/prisma/enums';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { ApiCreateComment } from './swagger/create-comment.swagger';
import { ApiUpdateComment } from './swagger/update-comment.swagger';
import { ApiDeleteComment } from './swagger/delete-comment.swagger';

@ApiTags('Forum Comments')
@Controller('forums/:forumId/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  // Create a new comment or reply in a discussion
  @Post()
  @ApiCreateComment()
  async create(
    @Param('forumId', new ParseUUIDPipe()) forumId: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    return this.commentsService.create(forumId, dto, userId, userRole);
  }

  // Update an existing comment in a discussion
  @Patch(':commentId')
  @ApiUpdateComment()
  async update(
    @Param('forumId', new ParseUUIDPipe()) forumId: string,
    @Param('commentId', new ParseUUIDPipe()) commentId: string,
    @Body() dto: UpdateCommentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.commentsService.update(forumId, commentId, dto, userId);
  }

  // Soft delete a comment in a discussion
  @Delete(':commentId')
  @ApiDeleteComment()
  async remove(
    @Param('forumId', new ParseUUIDPipe()) forumId: string,
    @Param('commentId', new ParseUUIDPipe()) commentId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    await this.commentsService.remove(forumId, commentId, userId, userRole);
    return {
      message: 'Comment deleted successfully',
    };
  }
}
