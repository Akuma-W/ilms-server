import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { TopicsService } from './topics.service';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { ApiTags } from '@nestjs/swagger';
import { ApiCreateTopic } from './swagger/create-topic.swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { QueryTopicDto } from './dto/query-topic.dto';
import { ApiDeleteTopic } from './swagger/delete-topic.swagger';
import { ApiGetTopics } from './swagger/get-topics.swagger';
import { ApiSearchTopic } from './swagger/search-topic.swagger';
import { ApiUpdateTopic } from './swagger/update-topic.swagger';

/**
 * Controller handling classroom topic management and search.
 */
@ApiTags('Topics')
@Controller('topics')
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) {}

  @Post('classes/:classId')
  @ApiCreateTopic()
  async create(
    @CurrentUser('id') userId: string,
    @Param('classId') classId: string,
    @Body() dto: CreateTopicDto,
  ) {
    return this.topicsService.create(userId, classId, dto);
  }

  @Get('classes/:classId')
  @ApiGetTopics()
  async findAll(@Param('classId') classId: string) {
    const data = await this.topicsService.findAll(classId);

    return data;
  }

  @Get('classes/:classId/search')
  @ApiSearchTopic()
  async search(
    @Param('classId') classId: string,
    @Query() query: QueryTopicDto,
  ) {
    const data = await this.topicsService.findMany(classId, query.title);
    return data;
  }

  @Patch(':id')
  @ApiUpdateTopic()
  async update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTopicDto,
  ) {
    const data = await this.topicsService.update(userId, id, dto);
    return {
      message: 'Update topic successful',
      data,
    };
  }

  @Delete(':id')
  @ApiDeleteTopic()
  async delete(@CurrentUser('id') userId: string, @Param('id') id: string) {
    await this.topicsService.delete(userId, id);
    return { message: 'Delete topic successful' };
  }
}
