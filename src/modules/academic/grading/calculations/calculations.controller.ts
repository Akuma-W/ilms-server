import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ClassTeacherGuard } from 'src/common/guards/class-teacher.guard';
import { CalculationsService } from './calculations.service';
import { BatchUpdateGradesDto } from './dto/batch-update-grades.dto';
import { CalculateAttendanceDto } from './dto/calculate-attendance.dto';
import { SyncGradesDto } from './dto/sync-grades.dto';
import { OverrideGradeDto } from './dto/override-grade.dto';
import { ApiBatchUpdateGrades } from './swagger/batch-update-grades.swagger';
import { ApiCalculateAttendance } from './swagger/calculate-attendance.swagger';
import { ApiSyncGrades } from './swagger/sync-grades.swagger';
import { ApiOverrideGrade } from './swagger/override-grade.swagger';

@ApiTags('Grades')
@Controller('classes/:classId/grades')
@UseGuards(ClassTeacherGuard)
export class CalculationsController {
  constructor(private readonly calculationsService: CalculationsService) {}

  // Batch update student grades across categories
  @Put('batch')
  @ApiBatchUpdateGrades()
  async batchUpdateGrades(
    @Param('classId', ParseUUIDPipe) classId: string,
    @Body() dto: BatchUpdateGradesDto,
  ) {
    return this.calculationsService.batchUpdateGrades(classId, dto);
  }

  // Automatically calculate and update attendance grades
  @Post('calculate-attendance')
  @ApiCalculateAttendance()
  async calculateAttendance(
    @Param('classId', ParseUUIDPipe) classId: string,
    @Body() dto: CalculateAttendanceDto,
  ) {
    return this.calculationsService.calculateAttendance(classId, dto);
  }

  // Automatically synchronize grades from designated sources (assignments, quizzes, attendance)
  @Post('sync')
  @ApiSyncGrades()
  async syncGrades(
    @Param('classId', ParseUUIDPipe) classId: string,
    @Body() dto: SyncGradesDto,
  ) {
    return this.calculationsService.syncGrades(classId, dto);
  }

  // Manually override or adjust student grade for a category
  @Post('override')
  @ApiOverrideGrade()
  async overrideGrade(
    @Param('classId', ParseUUIDPipe) classId: string,
    @Body() dto: OverrideGradeDto,
  ) {
    return this.calculationsService.overrideGrade(classId, dto);
  }
}
