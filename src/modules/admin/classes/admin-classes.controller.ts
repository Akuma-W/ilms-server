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
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/generated/prisma/enums';
import { JwtAuthGuard } from 'src/modules/auth/session/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { AdminClassesService } from './admin-classes.service';
import { QueryAdminClassesDto } from './dto/query-admin-classes.dto';
import { CreateAdminClassDto } from './dto/create-admin-class.dto';
import { UpdateAdminClassDto } from './dto/update-admin-class.dto';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';
import {
  ApiCreateAdminClass,
  ApiDeleteAdminClass,
  ApiGetAdminClasses,
  ApiToggleArchiveAdminClass,
  ApiUpdateAdminClass,
} from './swagger';

@ApiTags('Admin - Classes')
@ApiAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.admin)
@Controller('admin/classes')
export class AdminClassesController {
  constructor(private readonly classesService: AdminClassesService) {}

  // Lists all classrooms across system with filtering by school, subject, and archived status
  @Get()
  @ApiGetAdminClasses()
  async findAll(@Query() query: QueryAdminClassesDto) {
    const data = await this.classesService.findAll(query);
    return {
      message: 'Get classes successful',
      data,
    };
  }

  // Retrieves classroom details by unique identifier
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.classesService.findOne(id);
    return {
      message: 'Get class successful',
      data,
    };
  }

  // Creates classroom directly as administrator
  @Post()
  @ApiCreateAdminClass()
  async create(@Body() dto: CreateAdminClassDto) {
    const data = await this.classesService.create(dto);
    return {
      message: 'Create class successful',
      data,
    };
  }

  // Updates classroom settings as administrator
  @Patch(':id')
  @ApiUpdateAdminClass()
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAdminClassDto,
  ) {
    const data = await this.classesService.update(id, dto);
    return {
      message: 'Update class successful',
      data,
    };
  }

  // Archives classroom to read-only status
  @Patch(':id/archive')
  @ApiToggleArchiveAdminClass()
  async archive(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.classesService.toggleArchive(id, true);
    return {
      message: 'Class archived successfully',
      data,
    };
  }

  // Unarchives classroom to resume active operations
  @Patch(':id/unarchive')
  @ApiToggleArchiveAdminClass()
  async unarchive(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.classesService.toggleArchive(id, false);
    return {
      message: 'Class unarchived successfully',
      data,
    };
  }

  // Force deletes classroom as administrator
  @Delete(':id')
  @ApiDeleteAdminClass()
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.classesService.remove(id);
  }
}
