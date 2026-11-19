import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ClassTeacherGuard } from 'src/common/guards/class-teacher.guard';
import { ClassMemberGuard } from 'src/common/guards/class-member.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type { AuthUser } from 'src/modules/auth/session/interfaces/auth-user.interface';
import { GradebookService } from './gradebook.service';
import { ApiGetGradeMatrix } from './swagger/get-grade-matrix.swagger';
import { ApiGetGradeRecord } from './swagger/get-grade-record.swagger';
import { ApiGetAttendanceSummary } from './swagger/get-attendance-summary.swagger';
import { ApiGetGradeBreakdown } from './swagger/get-grade-breakdown.swagger';

@ApiTags('Grades')
@Controller('classes/:classId/grades')
export class GradebookController {
  constructor(private readonly gradebookService: GradebookService) {}

  // Get full classroom grade matrix and analytics (teachers/admins only)
  @Get('matrix')
  @UseGuards(ClassTeacherGuard)
  @ApiGetGradeMatrix()
  async getGradeMatrix(@Param('classId', ParseUUIDPipe) classId: string) {
    return this.gradebookService.getGradeMatrix(classId);
  }

  // Get personal student grade record and progress (students or teachers/admins)
  @Get('my-record')
  @UseGuards(ClassMemberGuard)
  @ApiGetGradeRecord()
  async getMyGradeRecord(
    @CurrentUser() user: AuthUser,
    @Param('classId', ParseUUIDPipe) classId: string,
    @Query('studentId') studentId?: string,
  ) {
    return this.gradebookService.getMyGradeRecord(
      user.id,
      user.role,
      classId,
      studentId,
    );
  }

  // Get attendance breakdown and predicted scores for teacher inspection (teachers/admins only)
  @Get('attendance-summary')
  @UseGuards(ClassTeacherGuard)
  @ApiGetAttendanceSummary()
  async getAttendanceSummary(
    @Param('classId', ParseUUIDPipe) classId: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.gradebookService.getAttendanceSummary(classId, categoryId);
  }

  // Get granular component breakdown contributing to category score (class members)
  @Get('categories/:catId/breakdown')
  @UseGuards(ClassMemberGuard)
  @ApiGetGradeBreakdown()
  async getCategoryBreakdown(
    @CurrentUser() user: AuthUser,
    @Param('classId', ParseUUIDPipe) classId: string,
    @Param('catId', ParseUUIDPipe) catId: string,
    @Query('studentId') studentId?: string,
  ) {
    const targetStudentId = studentId || user.id;
    return this.gradebookService.getCategoryBreakdown(
      classId,
      catId,
      targetStudentId,
    );
  }
}
