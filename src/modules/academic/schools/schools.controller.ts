import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SchoolsService } from './schools.service';
import { Public } from 'src/common/decorators/public.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/generated/prisma/enums';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type { AuthUser } from 'src/modules/auth/session/interfaces/auth-user.interface';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';

@ApiTags('Schools')
@Controller('schools')
export class SchoolsController {
  constructor(private readonly schoolsService: SchoolsService) {}

  // Lists all schools
  @Public()
  @Get()
  async findAll() {
    const data = await this.schoolsService.findAll();
    return { message: 'Get all schools successful', data };
  }

  // Finds teachers belonging to current user's school for assistant selection
  @Get('teachers')
  @ApiAuth()
  @ApiOperation({
    summary: 'Find active teachers in user school',
    description: 'Retrieves colleagues with teacher role in the same school',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search term for name or email',
    type: 'string',
    example: 'Khang',
  })
  @ApiResponse({
    status: 200,
    description: 'List of matching teachers in school',
  })
  @Roles(Role.teacher, Role.admin)
  async findSchoolTeachers(
    @CurrentUser() user: AuthUser,
    @Query('search') search?: string,
  ) {
    const data = await this.schoolsService.findSchoolTeachers(user.id, search);
    return { message: 'Get school teachers successful', data };
  }

  // Finds school by id
  @Public()
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.schoolsService.findOne(id);
  }
}
