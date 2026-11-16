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
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Role } from 'src/generated/prisma/enums';
import type { AuthUser } from 'src/modules/auth/session/interfaces/auth-user.interface';
import { SubjectsService } from './subjects.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { QuerySubjectDto } from './dto/query-subject.dto';
import {
  ApiCreateSubject,
  ApiDeleteSubject,
  ApiGetSubject,
  ApiGetSubjectClasses,
  ApiGetSubjects,
  ApiUpdateSubject,
} from './swagger/subjects-swagger.decorator';

@ApiTags('Subjects')
@Controller('subjects')
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  // Creates an academic subject (Admin only)
  @Post()
  @Roles(Role.admin)
  @ApiCreateSubject()
  async create(@Body() createSubjectDto: CreateSubjectDto) {
    return this.subjectsService.create(createSubjectDto);
  }

  // Lists subjects filtered by role permissions
  @Get()
  @Roles(Role.admin, Role.teacher, Role.student)
  @ApiGetSubjects()
  async findAll(
    @CurrentUser() user: AuthUser,
    @Query() query: QuerySubjectDto,
  ) {
    return this.subjectsService.findAll(user, query);
  }

  // Gets subject details by UUID
  @Get(':id')
  @Roles(Role.admin, Role.teacher, Role.student)
  @ApiGetSubject()
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.subjectsService.findOne(id, user);
  }

  // Updates subject attributes (Admin only)
  @Patch(':id')
  @Roles(Role.admin)
  @ApiUpdateSubject()
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSubjectDto: UpdateSubjectDto,
  ) {
    return this.subjectsService.update(id, updateSubjectDto);
  }

  // Deletes subject if unlinked to classes (Admin only)
  @Delete(':id')
  @Roles(Role.admin)
  @ApiDeleteSubject()
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.subjectsService.remove(id);
  }

  // Retrieves all active classes associated with this subject
  @Get(':id/classes')
  @Roles(Role.admin, Role.teacher, Role.student)
  @ApiGetSubjectClasses()
  async findSubjectClasses(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.subjectsService.findSubjectClasses(id, user);
  }
}
