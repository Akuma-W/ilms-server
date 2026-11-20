import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { EnrollmentStatus, Role } from 'src/generated/prisma/enums';
import { MeetingFacade } from 'src/infrastructures/meeting/meeting.facade';
import { NotificationFacade } from 'src/infrastructures/notification/notification.facade';
import { PrismaService } from 'src/infrastructures/prisma/prisma.service';
import { MeetingsService } from './meetings.service';

describe('MeetingsService', () => {
  let service: MeetingsService;

  const teacherId = 't1111111-1111-1111-1111-111111111111';
  const studentId = 's1111111-1111-1111-1111-111111111111';
  const classId = 'c1111111-1111-1111-1111-111111111111';
  const meetingId = 'm1111111-1111-1111-1111-111111111111';

  let mockPrisma: {
    class: { findUnique: jest.Mock };
    enrollment: { findUnique: jest.Mock; findMany: jest.Mock };
    meetingSession: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    meetingAttendance: {
      findFirst: jest.Mock;
      create: jest.Mock;
      upsert: jest.Mock;
      findMany: jest.Mock;
    };
    user: { findUnique: jest.Mock };
  };

  let mockMeetingFacade: {
    generateJoinToken: jest.Mock;
    closeRoom: jest.Mock;
  };

  let mockNotificationFacade: {
    sendEmail: jest.Mock;
  };

  beforeEach(() => {
    mockPrisma = {
      class: { findUnique: jest.fn() },
      enrollment: { findUnique: jest.fn(), findMany: jest.fn() },
      meetingSession: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      meetingAttendance: {
        findFirst: jest.fn(),
        create: jest.fn(),
        upsert: jest.fn(),
        findMany: jest.fn(),
      },
      user: { findUnique: jest.fn() },
    };

    mockMeetingFacade = {
      generateJoinToken: jest.fn(),
      closeRoom: jest.fn(),
    };

    mockNotificationFacade = {
      sendEmail: jest.fn(),
    };

    service = new MeetingsService(
      mockPrisma as unknown as PrismaService,
      mockMeetingFacade as unknown as MeetingFacade,
      mockNotificationFacade as unknown as NotificationFacade,
    );
  });

  describe('createMeeting', () => {
    it('should throw NotFoundException if class does not exist', async () => {
      mockPrisma.class.findUnique.mockResolvedValue(null);

      await expect(
        service.createMeeting(teacherId, classId, {
          title: 'Session 1',
          startTime: '2026-11-20T19:30:00.000Z',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not class teacher', async () => {
      mockPrisma.class.findUnique.mockResolvedValue({
        id: classId,
        teacherId: 'other-teacher',
      });

      await expect(
        service.createMeeting(teacherId, classId, {
          title: 'Session 1',
          startTime: '2026-11-20T19:30:00.000Z',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should create meeting session successfully', async () => {
      mockPrisma.class.findUnique.mockResolvedValue({
        id: classId,
        teacherId,
        title: 'CS1',
        courseCode: 'CS1-01',
      });

      mockPrisma.meetingSession.create.mockResolvedValue({
        id: meetingId,
        title: 'Session 1',
        description: 'Agenda',
        roomName: 'room-1',
        startTime: new Date('2026-11-20T19:30:00.000Z'),
        endTime: null,
        isLive: false,
        recordingUrl: null,
        classId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockPrisma.enrollment.findMany.mockResolvedValue([]);

      const res = await service.createMeeting(teacherId, classId, {
        title: 'Session 1',
        description: 'Agenda',
        startTime: '2026-11-20T19:30:00.000Z',
        notifyStudents: false,
      });

      expect(res.id).toBe(meetingId);
      expect(res.title).toBe('Session 1');
      expect(res.isLive).toBe(false);
    });
  });

  describe('joinMeeting', () => {
    it('should throw NotFoundException if session not found', async () => {
      mockPrisma.meetingSession.findUnique.mockResolvedValue(null);

      await expect(
        service.joinMeeting(meetingId, studentId, Role.student),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if meeting is closed', async () => {
      mockPrisma.meetingSession.findUnique.mockResolvedValue({
        id: meetingId,
        classId,
        isLive: false,
      });

      await expect(
        service.joinMeeting(meetingId, studentId, Role.student),
      ).rejects.toThrow(BadRequestException);
    });

    it('should log attendance and return livekit token for student', async () => {
      mockPrisma.meetingSession.findUnique.mockResolvedValue({
        id: meetingId,
        classId,
        roomName: 'room-1',
        isLive: true,
      });

      mockPrisma.class.findUnique.mockResolvedValue({
        id: classId,
        teacherId,
      });

      mockPrisma.enrollment.findUnique.mockResolvedValue({
        status: EnrollmentStatus.approved,
      });

      mockPrisma.user.findUnique.mockResolvedValue({
        fullName: 'Student A',
        email: 'student@example.com',
      });

      mockPrisma.meetingAttendance.upsert.mockResolvedValue({ id: 'att-1' });

      mockMeetingFacade.generateJoinToken.mockResolvedValue({
        token: 'signed-jwt',
        serverUrl: 'wss://livekit.cloud',
        roomName: 'room-1',
      });

      const res = await service.joinMeeting(meetingId, studentId, Role.student);

      expect(res.token).toBe('signed-jwt');
      expect(mockMeetingFacade.generateJoinToken).toHaveBeenCalledWith({
        roomName: 'room-1',
        participantId: studentId,
        participantName: 'Student A',
        isTeacher: false,
      });
      expect(mockPrisma.meetingAttendance.upsert).toHaveBeenCalledWith({
        where: {
          sessionId_studentId: {
            sessionId: meetingId,
            studentId,
          },
        },
        update: {},
        create: {
          sessionId: meetingId,
          classId,
          studentId,
        },
      });
    });

    it('should ignore P2002 error on attendance upsert and return token', async () => {
      mockPrisma.meetingSession.findUnique.mockResolvedValue({
        id: meetingId,
        classId,
        roomName: 'room-1',
        isLive: true,
      });

      mockPrisma.class.findUnique.mockResolvedValue({
        id: classId,
        teacherId,
      });

      mockPrisma.enrollment.findUnique.mockResolvedValue({
        status: EnrollmentStatus.approved,
      });

      mockPrisma.user.findUnique.mockResolvedValue({
        fullName: 'Student A',
        email: 'student@example.com',
      });

      mockPrisma.meetingAttendance.upsert.mockRejectedValue({ code: 'P2002' });

      mockMeetingFacade.generateJoinToken.mockResolvedValue({
        token: 'signed-jwt',
        serverUrl: 'wss://livekit.cloud',
        roomName: 'room-1',
      });

      const res = await service.joinMeeting(meetingId, studentId, Role.student);

      expect(res.token).toBe('signed-jwt');
    });
  });

  describe('updateMeeting', () => {
    it('should throw NotFoundException if session does not exist', async () => {
      mockPrisma.meetingSession.findUnique.mockResolvedValue(null);

      await expect(
        service.updateMeeting(meetingId, teacherId, Role.teacher, {
          title: 'Updated',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not teacher', async () => {
      mockPrisma.meetingSession.findUnique.mockResolvedValue({
        id: meetingId,
        class: { teacherId: 'other-teacher' },
      });

      await expect(
        service.updateMeeting(meetingId, teacherId, Role.teacher, {
          title: 'Updated',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should update session successfully', async () => {
      mockPrisma.meetingSession.findUnique.mockResolvedValue({
        id: meetingId,
        class: { teacherId },
      });

      mockPrisma.meetingSession.update.mockResolvedValue({
        id: meetingId,
        title: 'Updated Title',
        description: 'Updated Description',
        roomName: 'room-1',
        startTime: new Date(),
        endTime: null,
        isLive: true,
        recordingUrl: null,
        classId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await service.updateMeeting(
        meetingId,
        teacherId,
        Role.teacher,
        {
          title: 'Updated Title',
          description: 'Updated Description',
        },
      );

      expect(res.title).toBe('Updated Title');
      expect(mockPrisma.meetingSession.update).toHaveBeenCalled();
    });
  });

  describe('closeMeeting', () => {
    it('should update session to closed state with recording url', async () => {
      mockPrisma.meetingSession.findUnique.mockResolvedValue({
        id: meetingId,
        class: { teacherId },
      });

      mockPrisma.meetingSession.update.mockResolvedValue({
        id: meetingId,
        title: 'Session 1',
        description: null,
        roomName: 'room-1',
        startTime: new Date(),
        endTime: new Date(),
        isLive: false,
        recordingUrl: 'https://youtube.com/watch?v=sample',
        classId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await service.closeMeeting(
        meetingId,
        teacherId,
        Role.teacher,
        {
          recordingUrl: 'https://youtube.com/watch?v=sample',
        },
      );

      expect(res.isLive).toBe(false);
      expect(res.recordingUrl).toBe('https://youtube.com/watch?v=sample');
    });
  });

  describe('getMeetingAttendances', () => {
    it('should return attendee list for teacher', async () => {
      mockPrisma.meetingSession.findUnique.mockResolvedValue({
        id: meetingId,
        class: { teacherId },
      });

      mockPrisma.meetingAttendance.findMany.mockResolvedValue([
        {
          id: 'att-1',
          sessionId: meetingId,
          classId,
          studentId,
          joinedAt: new Date(),
          durationMinutes: 60,
          student: {
            fullName: 'Nguyen Van A',
            email: 'a@edu.vn',
            identityCode: 'SV-001',
            avatarUrl: null,
          },
        },
      ]);

      const res = await service.getMeetingAttendances(meetingId, teacherId);
      expect(res).toHaveLength(1);
      expect(res[0].studentName).toBe('Nguyen Van A');
      expect(res[0].studentEmail).toBe('a@edu.vn');
    });
  });
});
