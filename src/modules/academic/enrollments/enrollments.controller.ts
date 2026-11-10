import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { ApiTags } from '@nestjs/swagger';
import { ApiJoinClass } from './swagger/join-class.swagger';
import { ApiGetUserEnrollments } from './swagger/get-user-enrollments.swagger';
import { QueryEnrollmentDto } from './dto/query-enrollment.dto';
import { ApiGetMyEnrollments } from './swagger/get-my-enrollments.swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/generated/prisma/enums';
import { ApiUpdateEnrollment } from './swagger/update-enrollment.swagger';
import { ApiApproveEnrollment } from './swagger/approve-enrollment.swagger';
import { ApiRejectEnrollment } from './swagger/reject-enrollment.swagger';
import { ApiLeaveClass } from './swagger/leave-class.swagger';
import { ApiGetStarredClasses } from './swagger/get-starred-classes.swagger';
import { ApiGetClassRelation } from './swagger/get-class-relation.swagger';
import { ApiToggleStar } from './swagger/toggle-star.swagger';
import { ApiRemoveStudent } from './swagger/remove-student.swagger';

@ApiTags('Enrollments')
@Controller('enrollments')
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  // Join or request enrollment into a class
  @Post(['', 'join'])
  @ApiJoinClass()
  async create(
    @CurrentUser('id') currentUserId: string,
    @Body() createEnrollmentDto: CreateEnrollmentDto,
  ) {
    const result = await this.enrollmentsService.create(
      createEnrollmentDto,
      currentUserId,
    );

    return {
      message: 'Join class successful',
      data: result,
    };
  }

  // Get all enrollments for a specific user (admin)
  @Get('user/:userId')
  @Roles(Role.admin)
  @ApiGetUserEnrollments()
  async getUserEnrollments(
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Query() query: QueryEnrollmentDto,
  ) {
    const data = await this.enrollmentsService.findAll(userId, query);
    return {
      message: 'Get user enrollments successful',
      data,
    };
  }

  // Get all enrollments of current user
  @Get('me')
  @ApiGetMyEnrollments()
  async getMyEnrollments(
    @CurrentUser('id') userId: string,
    @Query() query: QueryEnrollmentDto,
  ) {
    const data = await this.enrollmentsService.findAll(userId, query);

    return {
      message: 'Get my enrollments successful',
      data,
    };
  }

  // Get all starred classes for current user
  @Get('me/star')
  @ApiGetStarredClasses()
  async getStarredClasses(@CurrentUser('id') userId: string) {
    const data = await this.enrollmentsService.getStarredClasses(userId);

    return {
      message: 'Get starred classes success',
      data,
    };
  }

  // Get current user relation or enrollment in a class
  @Get(['me/:classId', 'classes/:classId/relation'])
  @ApiGetClassRelation()
  async getMyClassRelation(
    @CurrentUser('id') userId: string,
    @Param('classId', new ParseUUIDPipe()) classId: string,
  ) {
    const enrollment = await this.enrollmentsService.findOne(userId, classId);

    return {
      message: 'Get class relation success',
      data: enrollment,
    };
  }

  // Toggle star status of an enrollment
  @Patch(':id/star')
  @ApiToggleStar()
  async toggleStar(
    @CurrentUser('id') userId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    const data = await this.enrollmentsService.toggleStar(userId, id);

    return {
      message: 'Toggle star success',
      data,
    };
  }

  // Student leaves a class
  @Delete([':classId/leave', 'classes/:classId/leave'])
  @ApiLeaveClass()
  async leaveClass(
    @CurrentUser('id') userId: string,
    @Param('classId', new ParseUUIDPipe()) classId: string,
  ) {
    return this.enrollmentsService.leaveClass(userId, classId);
  }

  // Teacher updates an enrollment
  @Patch(':classId/users/:userId')
  @Roles(Role.teacher, Role.admin)
  @ApiUpdateEnrollment()
  async updateEnrollment(
    @CurrentUser('id') userId: string,
    @Param('classId', new ParseUUIDPipe()) classId: string,
    @Param('userId', new ParseUUIDPipe()) targetUserId: string,
    @Body() dto: UpdateEnrollmentDto,
  ) {
    return this.enrollmentsService.update(userId, classId, targetUserId, dto);
  }

  // Teacher approves student enrollment
  @Patch(':classId/users/:userId/approve')
  @Roles(Role.teacher, Role.admin)
  @ApiApproveEnrollment()
  async approveEnrollment(
    @CurrentUser('id') userId: string,
    @Param('classId', new ParseUUIDPipe()) classId: string,
    @Param('userId', new ParseUUIDPipe()) studentId: string,
  ) {
    return this.enrollmentsService.approveEnrollment(
      userId,
      classId,
      studentId,
    );
  }

  // Teacher rejects student enrollment
  @Patch(':classId/users/:userId/reject')
  @Roles(Role.teacher, Role.admin)
  @ApiRejectEnrollment()
  async rejectEnrollment(
    @CurrentUser('id') userId: string,
    @Param('classId', new ParseUUIDPipe()) classId: string,
    @Param('userId', new ParseUUIDPipe()) studentId: string,
  ) {
    return this.enrollmentsService.rejectEnrollment(userId, classId, studentId);
  }

  // Teacher removes student from class
  @Delete(':classId/users/:userId')
  @Roles(Role.teacher, Role.admin)
  @ApiRemoveStudent()
  async removeStudent(
    @CurrentUser('id') userId: string,
    @Param('classId', new ParseUUIDPipe()) classId: string,
    @Param('userId', new ParseUUIDPipe()) studentId: string,
  ) {
    return this.enrollmentsService.removeStudent(userId, classId, studentId);
  }
}
