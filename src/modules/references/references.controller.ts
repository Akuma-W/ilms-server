import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { ReferencesService } from './references.service';
import { CreateReferenceDto } from './dto/create-reference.dto';
import { UpdateReferenceDto } from './dto/update-reference.dto';
import { ApiCreateReference } from './swagger/create-reference.swagger';
import { ApiGetTopicReferences } from './swagger/get-topic-references.swagger';
import { ApiGetReference } from './swagger/get-reference.swagger';
import { ApiUpdateReference } from './swagger/update-reference.swagger';
import { ApiDeleteReference } from './swagger/delete-reference.swagger';

/**
 * Controller handling reference resources and documentation links.
 */
@ApiTags('References')
@Controller('references')
export class ReferencesController {
  constructor(private readonly referencesService: ReferencesService) {}

  @Post('topics/:topicId')
  @ApiCreateReference()
  async create(
    @CurrentUser('id') userId: string,
    @Param('topicId', new ParseUUIDPipe()) topicId: string,
    @Body() dto: CreateReferenceDto,
  ) {
    return this.referencesService.create(userId, topicId, dto);
  }

  @Get('topics/:topicId')
  @ApiGetTopicReferences()
  async findAllByTopic(@Param('topicId', new ParseUUIDPipe()) topicId: string) {
    return this.referencesService.findAllByTopic(topicId);
  }

  @Get(':id')
  @ApiGetReference()
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.referencesService.findOne(id);
  }

  @Patch(':id')
  @ApiUpdateReference()
  async update(
    @CurrentUser('id') userId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateReferenceDto,
  ) {
    return this.referencesService.update(userId, id, dto);
  }

  @Delete(':id')
  @ApiDeleteReference()
  async delete(
    @CurrentUser('id') userId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.referencesService.delete(userId, id);
  }
}
