import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/generated/prisma/enums';
import { ApiCreateClass } from './swagger/create-class.swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type { AuthUser } from 'src/modules/auth/session/interfaces/auth-user.interface';
import { ApiGetClasses } from './swagger/get-classes.swagger';
import { QueryClassDto } from './dto/query-class.dto';
import { ApiGetClass } from './swagger/get-class.swagger';
import { ApiUpdateClass } from './swagger/update-class.swagger';
import { ApiDeleteClass } from './swagger/delete-class.swagger';
import { ApiGetMyTeachingClasses } from './swagger/get-my-classes.swagger';
import { ApiArchiveClass } from './swagger/archive-class.swagger';
import { ApiUnarchiveClass } from './swagger/unarchive-class.swagger';
import { ClassTeacherGuard } from 'src/common/guards/class-teacher.guard';
import { ApiAdminCreateClass } from './swagger/admin-create-class.swagger';
import { AdminCreateClassDto } from './dto/admin-create-class.dto';

@ApiTags('Classes')
@Controller('classes')
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  // Creates a new classroom by authenticated teacher
  @Post()
  @Roles(Role.teacher)
  @ApiCreateClass()
  async create(
    @CurrentUser('id') userId: string,
    @Body() createClassDto: CreateClassDto,
  ) {
    const result = await this.classesService.createByTeacher(
      userId,
      createClassDto,
    );

    return {
      message: 'Create class successful',
      data: result,
    };
  }

  // Creates a class with specified schoolId and teacherId on behalf of administrator
  @Post('admin')
  @Roles(Role.admin)
  @ApiAdminCreateClass()
  async createByAdmin(@Body() dto: AdminCreateClassDto) {
    const data = await this.classesService.createByAdmin(dto);
    return {
      message: 'Class created by administrator successfully',
      data,
    };
  }

  // Lists public classes in the current school
  @Get()
  @ApiGetClasses()
  async findAll(@CurrentUser('id') id: string, @Query() query: QueryClassDto) {
    const result = await this.classesService.findAll(id, query);

    return {
      message: 'Get classes successful',
      data: result,
    };
  }

  // Retrieves classroom details by unique identifier
  @Get(':id')
  @ApiGetClass()
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.classesService.findOne(id);
  }

  // Retrieves classroom details by alphanumeric course code
  @Get('code/:courseCode')
  @ApiGetClass()
  getClassByCourseCode(@Param('courseCode') courseCode: string) {
    return this.classesService.findByCourseCode(courseCode);
  }

  // Lists classes managed by currently authenticated instructor
  @Get('me/created')
  @ApiGetMyTeachingClasses()
  async getMyTeachingClasses(
    @CurrentUser('id') userId: string,
    @Query() query: QueryClassDto,
  ) {
    const result = await this.classesService.findMyTeachingClasses(
      userId,
      query,
    );
    return {
      message: 'Get classes successful',
      data: result,
    };
  }

  // Updates classroom settings and metadata
  @Patch(':id')
  @Roles(Role.teacher, Role.admin)
  @UseGuards(ClassTeacherGuard)
  @ApiUpdateClass()
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateClassDto,
  ) {
    return this.classesService.update(user, id, dto);
  }

  // Archives class to read-only status
  @Patch(':id/archive')
  @Roles(Role.teacher, Role.admin)
  @UseGuards(ClassTeacherGuard)
  @ApiArchiveClass()
  async archiveClass(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.classesService.archiveClass(user, id);
  }

  // Unarchives class and restores write operations
  @Patch(':id/unarchive')
  @Roles(Role.teacher, Role.admin)
  @UseGuards(ClassTeacherGuard)
  @ApiUnarchiveClass()
  async unarchiveClass(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.classesService.unarchiveClass(user, id);
  }

  // Permanently deletes classroom and cascades associated enrollments
  @Delete(':id')
  @Roles(Role.teacher, Role.admin)
  @UseGuards(ClassTeacherGuard)
  @ApiDeleteClass()
  async remove(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.classesService.remove(user, id);
  }
}
