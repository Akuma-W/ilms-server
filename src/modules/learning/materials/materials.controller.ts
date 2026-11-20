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
import { TrackMaterialProgressDto } from './dto/track-material-progress.dto';
import { ApiCreateMaterial } from './swagger/create-material.swagger';
import { ApiGetTopicMaterials } from './swagger/get-topic-materials.swagger';
import { ApiGetMaterial } from './swagger/get-material.swagger';
import { ApiUpdateMaterial } from './swagger/update-material.swagger';
import { ApiDeleteMaterial } from './swagger/delete-material.swagger';
import { ApiTrackMaterialProgress } from './swagger/track-material-progress.swagger';
import { ApiGetMyMaterialProgress } from './swagger/get-my-material-progress.swagger';

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
  async findAllByTopic(
    @Param('topicId', new ParseUUIDPipe()) topicId: string,
    @CurrentUser('id') userId?: string,
  ) {
    return userId
      ? this.materialsService.findAllByTopic(topicId, userId)
      : this.materialsService.findAllByTopic(topicId);
  }

  // Retrieves student's material progress for all materials in a class
  @Get('class/:classId/my-progress')
  @ApiGetMyMaterialProgress()
  async getMyClassProgress(
    @CurrentUser('id') userId: string,
    @Param('classId', new ParseUUIDPipe()) classId: string,
  ) {
    return this.materialsService.getMyClassProgress(userId, classId);
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

  // Tracks student material reading progress
  @Post(':id/progress')
  @ApiTrackMaterialProgress()
  async trackProgress(
    @CurrentUser('id') userId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: TrackMaterialProgressDto,
  ) {
    return this.materialsService.trackProgress(
      userId,
      id,
      dto.isCompleted ?? true,
    );
  }
}
