import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Role } from 'src/generated/prisma/enums';
import { ForumsService } from './forums.service';
import { CreateForumDto } from './dto/create-forum.dto';
import { UpdateForumDto } from './dto/update-forum.dto';
import { QueryForumDto } from './dto/query-forum.dto';
import { ApiCreateForum } from './swagger/create-forum.swagger';
import { ApiGetClassForums } from './swagger/get-class-forums.swagger';
import { ApiGetForumDetail } from './swagger/get-forum-detail.swagger';
import { ApiUpdateForum } from './swagger/update-forum.swagger';
import { ApiDeleteForum } from './swagger/delete-forum.swagger';

@ApiTags('Forums')
@Controller()
export class ForumsController {
  constructor(private readonly forumsService: ForumsService) {}

  // Get discussion topics for a classroom with filtering
  @Get(['classes/:classId/forums', 'forums/classes/:classId'])
  @ApiGetClassForums()
  async findAll(
    @Param('classId', new ParseUUIDPipe()) classId: string,
    @Query() query: QueryForumDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    return this.forumsService.findAll(classId, query, userId, userRole);
  }

  // Get single discussion topic detail with nested comments
  @Get('forums/:forumId')
  @ApiGetForumDetail()
  async findOne(
    @Param('forumId', new ParseUUIDPipe()) forumId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    return this.forumsService.findOne(forumId, userId, userRole);
  }

  // Create new discussion topic in a classroom
  @Post(['classes/:classId/forums', 'forums/classes/:classId'])
  @ApiCreateForum()
  async create(
    @Param('classId', new ParseUUIDPipe()) classId: string,
    @Body() dto: CreateForumDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    return this.forumsService.create(classId, dto, userId, userRole);
  }

  // Update an existing discussion topic
  @Patch('forums/:forumId')
  @ApiUpdateForum()
  async update(
    @Param('forumId', new ParseUUIDPipe()) forumId: string,
    @Body() dto: UpdateForumDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.forumsService.update(forumId, dto, userId);
  }

  // Soft delete a discussion topic
  @Delete('forums/:forumId')
  @ApiDeleteForum()
  async remove(
    @Param('forumId', new ParseUUIDPipe()) forumId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    await this.forumsService.remove(forumId, userId, userRole);
    return {
      message: 'Discussion topic deleted successfully',
    };
  }
}
