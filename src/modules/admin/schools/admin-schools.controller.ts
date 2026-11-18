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
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';
import { AdminSchoolsService } from './admin-schools.service';
import { CreateAdminSchoolDto } from './dto/create-admin-school.dto';
import { UpdateAdminSchoolDto } from './dto/update-admin-school.dto';
import { QueryAdminSchoolsDto } from './dto/query-admin-schools.dto';
import {
  ApiCreateAdminSchool,
  ApiDeleteAdminSchool,
  ApiGetAdminSchool,
  ApiGetAdminSchools,
  ApiUpdateAdminSchool,
} from './swagger';

@ApiTags('Admin - Schools')
@ApiAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.admin)
@Controller('admin/schools')
export class AdminSchoolsController {
  constructor(private readonly schoolsService: AdminSchoolsService) {}

  // Registers a new school institution in system
  @Post()
  @ApiCreateAdminSchool()
  async create(@Body() dto: CreateAdminSchoolDto) {
    const data = await this.schoolsService.create(dto);
    return {
      message: 'School created successfully',
      data,
    };
  }

  // Lists all registered schools with aggregated statistics and filtering
  @Get()
  @ApiGetAdminSchools()
  async findAll(@Query() query: QueryAdminSchoolsDto) {
    const data = await this.schoolsService.findAll(query);
    return {
      message: 'Get schools successful',
      data,
    };
  }

  // Retrieves institutional profile by UUID identifier
  @Get(':id')
  @ApiGetAdminSchool()
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.schoolsService.findOne(id);
    return {
      message: 'Get school successful',
      data,
    };
  }

  // Updates school attributes and operational lifecycle status
  @Patch(':id')
  @ApiUpdateAdminSchool()
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAdminSchoolDto,
  ) {
    const data = await this.schoolsService.update(id, dto);
    return {
      message: 'School updated successfully',
      data,
    };
  }

  // Removes unlinked school institution or rejects if records exist
  @Delete(':id')
  @ApiDeleteAdminSchool()
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.schoolsService.remove(id);
  }
}
