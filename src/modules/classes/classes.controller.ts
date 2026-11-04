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
import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/generated/prisma/enums';
import { ApiCreateClass } from './swagger/create-class.swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type { AuthUser } from '../auth/session/interfaces/auth-user.interface';
import { ApiGetClasses } from './swagger/get-classes.swagger';
import { QueryClassDto } from './dto/query-class.dto';
import { ApiGetClass } from './swagger/get-class.swagger';
import { ApiUpdateClass } from './swagger/update-class.swagger';
import { ApiDeleteClass } from './swagger/delete-class.swagger';
import { ApiGetMyTeachingClasses } from './swagger/get-my-classes.swagger';

@ApiTags('Classes')
@Controller('classes')
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Post()
  @Roles(Role.teacher, Role.admin)
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

  @Get()
  @ApiGetClasses()
  async findAll(@CurrentUser('id') id: string, @Query() query: QueryClassDto) {
    const result = await this.classesService.findAll(id, query);

    return {
      message: 'Get classes successful',
      data: result,
    };
  }

  @Get(':id')
  @ApiGetClass()
  findOne(@Param('id') id: string) {
    return this.classesService.findOne(id);
  }

  @Get('code/:courseCode')
  @ApiGetClass()
  getClassByCourseCode(@Param('courseCode') courseCode: string) {
    return this.classesService.findByCourseCode(courseCode);
  }

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

  @Patch(':id')
  @Roles(Role.teacher, Role.admin)
  @ApiUpdateClass()
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateClassDto,
  ) {
    return this.classesService.update(user, id, dto);
  }

  @Delete(':id')
  @Roles(Role.teacher, Role.admin)
  @ApiDeleteClass()
  async remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.classesService.remove(user, id);
  }
}
