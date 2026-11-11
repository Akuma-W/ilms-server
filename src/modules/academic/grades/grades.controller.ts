import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Put,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type { AuthUser } from 'src/modules/auth/session/interfaces/auth-user.interface';
import { GradesService } from './grades.service';
import { BatchUpdateGradesDto } from './dto/batch-update-grades.dto';
import { ApiGetGradeMatrix } from './swagger/get-grade-matrix.swagger';
import { ApiGetGradeRecord } from './swagger/get-grade-record.swagger';
import { ApiBatchUpdateGrades } from './swagger/batch-update-grades.swagger';

@ApiTags('Grades')
@Controller('classes/:classId/grades')
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  // Get full classroom grade matrix and analytics
  @Get('matrix')
  @ApiGetGradeMatrix()
  async getGradeMatrix(
    @CurrentUser() user: AuthUser,
    @Param('classId', ParseUUIDPipe) classId: string,
  ) {
    return this.gradesService.getGradeMatrix(user.id, user.role, classId);
  }

  // Get personal student grade record and progress
  @Get('my-record')
  @ApiGetGradeRecord()
  async getMyGradeRecord(
    @CurrentUser() user: AuthUser,
    @Param('classId', ParseUUIDPipe) classId: string,
    @Query('studentId') studentId?: string,
  ) {
    return this.gradesService.getMyGradeRecord(
      user.id,
      user.role,
      classId,
      studentId,
    );
  }

  // Batch update student grades across categories
  @Put('batch')
  @ApiBatchUpdateGrades()
  async batchUpdateGrades(
    @CurrentUser() user: AuthUser,
    @Param('classId', ParseUUIDPipe) classId: string,
    @Body() dto: BatchUpdateGradesDto,
  ) {
    return this.gradesService.batchUpdateGrades(
      user.id,
      user.role,
      classId,
      dto,
    );
  }
}
