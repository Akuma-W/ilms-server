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

@ApiTags('Enrollments')
@Controller('enrollments')
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  // Join class
  @Post('join')
  @ApiJoinClass()
  async create(@Body() createEnrollmentDto: CreateEnrollmentDto) {
    const result = await this.enrollmentsService.create(createEnrollmentDto);

    return {
      message: 'Join class successful',
      data: result,
    };
  }

  // Get all user enrollments
  @Get('user/:userId')
  @ApiGetUserEnrollments()
  async getUserEnrollments(
    @Param('userId') userId: string,
    @Query() query: QueryEnrollmentDto,
  ) {
    const data = await this.enrollmentsService.findAll(userId, query);
    return {
      message: `Get enrollments with status: ${query.status || 'all'}${query.isStarred !== undefined ? ` and starred: ${query.isStarred}` : ''}`,
      data,
    };
  }

  // Get all my enrollments
  @Get('me')
  @ApiGetMyEnrollments()
  async getMyEnrollments(
    @CurrentUser('id') userId: string,
    @Query() query: QueryEnrollmentDto,
  ) {
    const data = await this.enrollmentsService.findAll(userId, query);

    return {
      message: `Get my enrollments with status: ${query.status || 'all'}${query.isStarred !== undefined ? ` and starred: ${query.isStarred}` : ''}`,
      data,
    };
  }

  // Get my starred classes
  @Get('me/star')
  async getStarredClasses(@CurrentUser('id') userId: string) {
    const data = await this.enrollmentsService.getStarredClasses(userId);

    return {
      message: 'Get starred classes success',
      data,
    };
  }

  // Get my relation in class
  @Get('me/:classId')
  async getMyClassRelation(
    @Param('classId') classId: string,
    @CurrentUser('id') userId: string,
  ) {
    const enrollment = await this.enrollmentsService.findOne(userId, classId);

    return {
      message: 'Get class relation success',
      data: enrollment,
    };
  }

  // Teacher can update enrollments
  @Patch(':classId/users/:userId')
  @Roles(Role.teacher, Role.admin)
  @ApiUpdateEnrollment()
  async updateEnrollment(
    @CurrentUser('id') userId: string,
    @Param('classId') classId: string,
    @Param('userId') targetUserId: string,
    @Body() dto: UpdateEnrollmentDto,
  ) {
    return this.enrollmentsService.update(userId, classId, targetUserId, dto);
  }

  // Mark/remove star in class
  @Patch('/:id/star')
  async toggleStar(@CurrentUser('id') userId: string, @Param('id') id: string) {
    const data = await this.enrollmentsService.toggleStar(userId, id);

    return {
      message: 'Toggle star success',
      data,
    };
  }

  // Approve student
  @Patch(':classId/users/:userId/approve')
  @Roles(Role.teacher, Role.admin)
  @ApiApproveEnrollment()
  async approveEnrollment(
    @CurrentUser('id') userId: string,
    @Param('classId') classId: string,
    @Param('userId') studentId: string,
  ) {
    return this.enrollmentsService.approveEnrollment(
      userId,
      classId,
      studentId,
    );
  }

  // Reject student
  @Patch(':classId/users/:userId/reject')
  @Roles(Role.teacher, Role.admin)
  @ApiRejectEnrollment()
  async rejectEnrollment(
    @CurrentUser('id') userId: string,
    @Param('classId') classId: string,
    @Param('userId') studentId: string,
  ) {
    return this.enrollmentsService.rejectEnrollment(userId, classId, studentId);
  }

  // Leave class
  @Delete(':classId/leave')
  @ApiLeaveClass()
  async leaveClass(
    @CurrentUser('id') userId: string,
    @Param('classId') classId: string,
  ) {
    return this.enrollmentsService.leaveClass(userId, classId);
  }

  // Remove student (teacher)
  @Delete(':classId/users/:userId')
  @Roles(Role.teacher, Role.admin)
  @ApiLeaveClass()
  async removeStudent(
    @CurrentUser('id') userId: string,
    @Param('classId') classId: string,
    @Param('userId') studentId: string,
  ) {
    return this.enrollmentsService.removeStudent(userId, classId, studentId);
  }
}
