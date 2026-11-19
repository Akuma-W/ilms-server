import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Role } from 'src/generated/prisma/enums';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { ApiAuth } from 'src/common/swagger/api-auth.decorator';
import { CloseMeetingDto } from './dto/close-meeting.dto';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { UpdateMeetingDto } from './dto/update-meeting.dto';
import { MeetingAttendanceEntity } from './entities/meeting-attendance.entity';
import { MeetingSessionEntity } from './entities/meeting-session.entity';
import { MeetingTokenResponseEntity } from './entities/meeting-token-response.entity';
import { MeetingsService } from './meetings.service';
import { ApiCloseMeetingSession } from './swagger/close-meeting.swagger';
import { ApiCreateMeeting } from './swagger/create-meeting.swagger';
import { ApiGetMeetingAttendances } from './swagger/get-meeting-attendances.swagger';
import { ApiGetMeetingDetail } from './swagger/get-meeting-detail.swagger';
import { ApiGetClassMeetings } from './swagger/get-meetings.swagger';
import { ApiJoinMeetingSession } from './swagger/join-meeting.swagger';
import { ApiUpdateMeetingSession } from './swagger/update-meeting.swagger';

@ApiTags('Academic - Meetings')
@ApiAuth()
@Controller()
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  // Schedules a new meeting session for a classroom
  @Post('classes/:classId/meetings')
  @Roles(Role.teacher, Role.admin)
  @ApiCreateMeeting()
  async createMeeting(
    @CurrentUser('id') teacherId: string,
    @Param('classId', ParseUUIDPipe) classId: string,
    @Body() dto: CreateMeetingDto,
  ): Promise<MeetingSessionEntity> {
    return this.meetingsService.createMeeting(teacherId, classId, dto);
  }

  // Retrieves all meeting sessions for a classroom
  @Get('classes/:classId/meetings')
  @Roles(Role.student, Role.teacher, Role.admin)
  @ApiGetClassMeetings()
  async getMeetingsByClass(
    @Param('classId', ParseUUIDPipe) classId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
  ): Promise<MeetingSessionEntity[]> {
    return this.meetingsService.getMeetingsByClass(classId, userId, role);
  }

  // Retrieves single meeting session detail
  @Get('meetings/:id')
  @Roles(Role.student, Role.teacher, Role.admin)
  @ApiGetMeetingDetail()
  async getMeetingDetail(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
  ): Promise<MeetingSessionEntity> {
    return this.meetingsService.getMeetingDetail(id, userId, role);
  }

  // Gateway join endpoint logging attendance and generating LiveKit token
  @Post('meetings/:id/join')
  @Roles(Role.student, Role.teacher, Role.admin)
  @ApiJoinMeetingSession()
  async joinMeeting(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
  ): Promise<MeetingTokenResponseEntity> {
    return this.meetingsService.joinMeeting(id, userId, role);
  }

  // Updates meeting session details
  @Patch('meetings/:id')
  @Roles(Role.teacher, Role.admin)
  @ApiUpdateMeetingSession()
  async updateMeeting(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') teacherId: string,
    @CurrentUser('role') role: Role,
    @Body() dto: UpdateMeetingDto,
  ): Promise<MeetingSessionEntity> {
    return this.meetingsService.updateMeeting(id, teacherId, role, dto);
  }

  // Concludes meeting session and optionally attaches recording URL
  @Patch('meetings/:id/close')
  @Roles(Role.teacher, Role.admin)
  @ApiCloseMeetingSession()
  async closeMeeting(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') teacherId: string,
    @Body() dto: CloseMeetingDto,
  ): Promise<MeetingSessionEntity> {
    return this.meetingsService.closeMeeting(id, teacherId, dto);
  }

  // Retrieves detailed list of student attendees for grading
  @Get('meetings/:id/attendances')
  @Roles(Role.teacher, Role.admin)
  @ApiGetMeetingAttendances()
  async getMeetingAttendances(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') teacherId: string,
  ): Promise<MeetingAttendanceEntity[]> {
    return this.meetingsService.getMeetingAttendances(id, teacherId);
  }
}
