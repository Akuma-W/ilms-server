import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { AssignmentsService } from './assignments.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { ApiCreateAssignment } from './swagger/create-assignment.swagger';
import { ApiGetClassAssignments } from './swagger/get-class-assignments.swagger';
import { ApiGetAssignment } from './swagger/get-assignment.swagger';
import { ApiUpdateAssignment } from './swagger/update-assignment.swagger';
import { ApiDeleteAssignment } from './swagger/delete-assignment.swagger';

/**
 * Controller handling classroom assignments and their resource materials.
 */
@ApiTags('Assignments')
@Controller('assignments')
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Post('classes/:classId')
  @ApiCreateAssignment()
  async create(
    @CurrentUser('id') userId: string,
    @Param('classId', new ParseUUIDPipe()) classId: string,
    @Body() dto: CreateAssignmentDto,
  ) {
    return this.assignmentsService.create(userId, classId, dto);
  }

  @Get('classes/:classId')
  @ApiGetClassAssignments()
  async findAllByClass(
    @CurrentUser('id') userId: string,
    @Param('classId', new ParseUUIDPipe()) classId: string,
  ) {
    const data = await this.assignmentsService.findAllByClass(userId, classId);

    return {
      message: 'Assignments retrieved successfully',
      data,
    };
  }

  @Get(':id')
  @ApiGetAssignment()
  async findOne(
    @CurrentUser('id') userId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.assignmentsService.findOne(userId, id);
  }

  @Patch(':id')
  @ApiUpdateAssignment()
  async update(
    @CurrentUser('id') userId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateAssignmentDto,
  ) {
    return this.assignmentsService.update(userId, id, dto);
  }

  @Delete(':id')
  @ApiDeleteAssignment()
  async delete(
    @CurrentUser('id') userId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.assignmentsService.delete(userId, id);
  }
}
