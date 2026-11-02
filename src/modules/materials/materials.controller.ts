import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { MaterialsService } from './materials.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';

@ApiTags('Materials')
@Controller('materials')
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @Post('topics/:topicId')
  @ApiOperation({
    summary: 'Tạo tài liệu học tập mới dưới một Chuyên đề (Topic)',
  })
  @ApiResponse({ status: 201, description: 'Tạo tài liệu thành công' })
  @ApiResponse({
    status: 403,
    description: 'Không có quyền (không phải giảng viên lớp)',
  })
  async create(
    @CurrentUser('id') userId: string,
    @Param('topicId') topicId: string,
    @Body() dto: CreateMaterialDto,
  ) {
    return this.materialsService.create(userId, topicId, dto);
  }

  @Get('topics/:topicId')
  @ApiOperation({
    summary: 'Lấy toàn bộ danh sách tài liệu học tập của một Chuyên đề',
  })
  @ApiResponse({ status: 200, description: 'Lấy danh sách thành công' })
  async findAllByTopic(@Param('topicId') topicId: string) {
    return this.materialsService.findAllByTopic(topicId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết một tài liệu' })
  @ApiResponse({ status: 200, description: 'Lấy chi tiết thành công' })
  @ApiResponse({ status: 404, description: 'Tài liệu không tồn tại' })
  async findOne(@Param('id') id: string) {
    return this.materialsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Cập nhật thông tin tài liệu (Yêu cầu quyền giảng viên)',
  })
  @ApiResponse({ status: 200, description: 'Cập nhật tài liệu thành công' })
  async update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateMaterialDto,
  ) {
    return this.materialsService.update(userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa tài liệu học tập (Yêu cầu quyền giảng viên)' })
  @ApiResponse({ status: 200, description: 'Xóa tài liệu thành công' })
  async delete(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.materialsService.delete(userId, id);
  }
}
