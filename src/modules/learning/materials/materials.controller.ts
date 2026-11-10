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
import { MaterialsService } from './materials.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { ApiCreateMaterial } from './swagger/create-material.swagger';
import { ApiGetTopicMaterials } from './swagger/get-topic-materials.swagger';
import { ApiGetMaterial } from './swagger/get-material.swagger';
import { ApiUpdateMaterial } from './swagger/update-material.swagger';
import { ApiDeleteMaterial } from './swagger/delete-material.swagger';

/**
 * Controller handling learning materials management and retrieval.
 */
@ApiTags('Materials')
@Controller('materials')
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @Post('topics/:topicId')
  @ApiCreateMaterial()
  async create(
    @CurrentUser('id') userId: string,
    @Param('topicId', new ParseUUIDPipe()) topicId: string,
    @Body() dto: CreateMaterialDto,
  ) {
    return this.materialsService.create(userId, topicId, dto);
  }

  @Get('topics/:topicId')
  @ApiGetTopicMaterials()
  async findAllByTopic(@Param('topicId', new ParseUUIDPipe()) topicId: string) {
    return this.materialsService.findAllByTopic(topicId);
  }

  @Get(':id')
  @ApiGetMaterial()
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.materialsService.findOne(id);
  }

  @Patch(':id')
  @ApiUpdateMaterial()
  async update(
    @CurrentUser('id') userId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateMaterialDto,
  ) {
    return this.materialsService.update(userId, id, dto);
  }

  @Delete(':id')
  @ApiDeleteMaterial()
  async delete(
    @CurrentUser('id') userId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.materialsService.delete(userId, id);
  }
}
