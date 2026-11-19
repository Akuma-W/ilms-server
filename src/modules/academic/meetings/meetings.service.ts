import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from 'src/generated/prisma/enums';
import { MeetingFacade } from 'src/infrastructures/meeting/meeting.facade';
import { NotificationFacade } from 'src/infrastructures/notification/notification.facade';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { CloseMeetingDto } from './dto/close-meeting.dto';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { UpdateMeetingDto } from './dto/update-meeting.dto';
import { MeetingAttendanceEntity } from './entities/meeting-attendance.entity';
import { MeetingSessionEntity } from './entities/meeting-session.entity';
import { MeetingTokenResponseEntity } from './entities/meeting-token-response.entity';
import { dispatchMeetingAnnouncement } from './utils/meeting-notification.util';
import { verifyClassAccess } from './utils/meeting-access.util';

@Injectable()
export class MeetingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly meetingFacade: MeetingFacade,
    private readonly notificationFacade: NotificationFacade,
  ) {}

  // Creates meeting session, generates LiveKit room name and dispatches notification
  async createMeeting(
    teacherId: string,
    classId: string,
    dto: CreateMeetingDto,
  ): Promise<MeetingSessionEntity> {
    const targetClass = await this.prisma.class.findUnique({
      where: { id: classId },
    });

    if (!targetClass) {
      throw new NotFoundException('Class not found');
    }

    if (targetClass.teacherId !== teacherId) {
      throw new ForbiddenException('Only class teacher can schedule meetings');
    }

    const roomName = `class-${classId}-${Date.now()}`;
    const startTime = new Date(dto.startTime);

    const session = await this.prisma.meetingSession.create({
      data: {
        title: dto.title.trim(),
        description: dto.description?.trim(),
        roomName,
        startTime,
        classId,
        isLive: true,
      },
    });

    if (dto.notifyStudents) {
      void dispatchMeetingAnnouncement(
        this.prisma,
        this.notificationFacade,
        classId,
        session.title,
        startTime,
        session.description || undefined,
        dto.language || 'en',
      );
    }

    return {
      id: session.id,
      title: session.title,
      description: session.description,
      roomName: session.roomName,
      startTime: session.startTime,
      endTime: session.endTime,
      isLive: session.isLive,
      recordingUrl: session.recordingUrl,
      classId: session.classId,
      attendanceCount: 0,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    };
  }

  // Retrieves all meeting sessions for a classroom with attendance counts
  async getMeetingsByClass(
    classId: string,
    userId: string,
    role: Role,
  ): Promise<MeetingSessionEntity[]> {
    await verifyClassAccess(this.prisma, classId, userId, role);

    const sessions = await this.prisma.meetingSession.findMany({
      where: { classId },
      orderBy: { startTime: 'desc' },
      include: {
        _count: {
          select: { attendances: true },
        },
      },
    });

    return sessions.map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      roomName: s.roomName,
      startTime: s.startTime,
      endTime: s.endTime,
      isLive: s.isLive,
      recordingUrl: s.recordingUrl,
      classId: s.classId,
      attendanceCount: s._count.attendances,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));
  }

  // Retrieves single meeting session detail
  async getMeetingDetail(
    meetingId: string,
    userId: string,
    role: Role,
  ): Promise<MeetingSessionEntity> {
    const session = await this.prisma.meetingSession.findUnique({
      where: { id: meetingId },
      include: {
        _count: {
          select: { attendances: true },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Meeting session not found');
    }

    await verifyClassAccess(this.prisma, session.classId, userId, role);

    return {
      id: session.id,
      title: session.title,
      description: session.description,
      roomName: session.roomName,
      startTime: session.startTime,
      endTime: session.endTime,
      isLive: session.isLive,
      recordingUrl: session.recordingUrl,
      classId: session.classId,
      attendanceCount: session._count.attendances,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    };
  }

  // Gateway logging attendance and minting LiveKit room access token
  async joinMeeting(
    meetingId: string,
    userId: string,
    role: Role,
  ): Promise<MeetingTokenResponseEntity> {
    const session = await this.prisma.meetingSession.findUnique({
      where: { id: meetingId },
    });

    if (!session) {
      throw new NotFoundException('Meeting session not found');
    }

    if (!session.isLive) {
      throw new BadRequestException('Meeting session is closed');
    }

    await verifyClassAccess(this.prisma, session.classId, userId, role);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { fullName: true, email: true },
    });
    const participantName = user?.fullName || user?.email || 'Participant';

    const isTeacher = role === Role.teacher || role === Role.admin;

    // Logs attendance record for student only
    if (!isTeacher) {
      const existingAttendance = await this.prisma.meetingAttendance.findFirst({
        where: {
          sessionId: session.id,
          studentId: userId,
        },
      });

      if (!existingAttendance) {
        await this.prisma.meetingAttendance.create({
          data: {
            sessionId: session.id,
            classId: session.classId,
            studentId: userId,
          },
        });
      }
    }

    const tokenRes = await this.meetingFacade.generateJoinToken({
      roomName: session.roomName,
      participantId: userId,
      participantName,
      isTeacher,
    });

    return {
      token: tokenRes.token,
      serverUrl: tokenRes.serverUrl,
      roomName: tokenRes.roomName,
      session: {
        id: session.id,
        title: session.title,
        description: session.description,
        roomName: session.roomName,
        startTime: session.startTime,
        endTime: session.endTime,
        isLive: session.isLive,
        recordingUrl: session.recordingUrl,
        classId: session.classId,
      },
    };
  }

  // Concludes meeting session and attaches recording url
  async closeMeeting(
    meetingId: string,
    teacherId: string,
    dto: CloseMeetingDto,
  ): Promise<MeetingSessionEntity> {
    const session = await this.prisma.meetingSession.findUnique({
      where: { id: meetingId },
      include: { class: { select: { teacherId: true } } },
    });

    if (!session) {
      throw new NotFoundException('Meeting session not found');
    }

    if (session.class.teacherId !== teacherId) {
      throw new ForbiddenException('Only class teacher can close meeting');
    }

    const updated = await this.prisma.meetingSession.update({
      where: { id: meetingId },
      data: {
        isLive: false,
        endTime: new Date(),
        ...(dto.recordingUrl && { recordingUrl: dto.recordingUrl.trim() }),
      },
    });

    return {
      id: updated.id,
      title: updated.title,
      description: updated.description,
      roomName: updated.roomName,
      startTime: updated.startTime,
      endTime: updated.endTime,
      isLive: updated.isLive,
      recordingUrl: updated.recordingUrl,
      classId: updated.classId,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  // Updates scheduled meeting session details (title, description, startTime)
  async updateMeeting(
    meetingId: string,
    teacherId: string,
    role: Role,
    dto: UpdateMeetingDto,
  ): Promise<MeetingSessionEntity> {
    const session = await this.prisma.meetingSession.findUnique({
      where: { id: meetingId },
      include: { class: { select: { teacherId: true } } },
    });

    if (!session) {
      throw new NotFoundException('Meeting session not found');
    }

    if (role !== Role.admin && session.class.teacherId !== teacherId) {
      throw new ForbiddenException('Only class teacher can update meeting');
    }

    const updated = await this.prisma.meetingSession.update({
      where: { id: meetingId },
      data: {
        ...(dto.title !== undefined && { title: dto.title.trim() }),
        ...(dto.description !== undefined && {
          description: dto.description.trim(),
        }),
        ...(dto.startTime !== undefined && {
          startTime: new Date(dto.startTime),
        }),
      },
    });

    return {
      id: updated.id,
      title: updated.title,
      description: updated.description,
      roomName: updated.roomName,
      startTime: updated.startTime,
      endTime: updated.endTime,
      isLive: updated.isLive,
      recordingUrl: updated.recordingUrl,
      classId: updated.classId,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  // Returns list of student attendees for post-session grading
  async getMeetingAttendances(
    meetingId: string,
    teacherId: string,
  ): Promise<MeetingAttendanceEntity[]> {
    const session = await this.prisma.meetingSession.findUnique({
      where: { id: meetingId },
      include: { class: { select: { teacherId: true } } },
    });

    if (!session) {
      throw new NotFoundException('Meeting session not found');
    }

    if (session.class.teacherId !== teacherId) {
      throw new ForbiddenException('Only class teacher can view attendances');
    }

    const attendances = await this.prisma.meetingAttendance.findMany({
      where: { sessionId: meetingId },
      include: {
        student: {
          select: {
            fullName: true,
            email: true,
            identityCode: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    return attendances.map((att) => ({
      id: att.id,
      sessionId: att.sessionId,
      classId: att.classId,
      studentId: att.studentId,
      studentName: att.student.fullName,
      studentEmail: att.student.email,
      identityCode: att.student.identityCode,
      avatarUrl: att.student.avatarUrl,
      joinedAt: att.joinedAt,
      durationMinutes: att.durationMinutes,
    }));
  }
}
