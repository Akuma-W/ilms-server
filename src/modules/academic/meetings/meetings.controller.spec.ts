import { Role } from 'src/generated/prisma/enums';
import { MeetingsController } from './meetings.controller';
import { MeetingsService } from './meetings.service';

describe('MeetingsController', () => {
  let controller: MeetingsController;
  let mockService: {
    createMeeting: jest.Mock;
    getMeetingsByClass: jest.Mock;
    getMeetingDetail: jest.Mock;
    joinMeeting: jest.Mock;
    updateMeeting: jest.Mock;
    closeMeeting: jest.Mock;
    getMeetingAttendances: jest.Mock;
  };

  const teacherId = 't1111111-1111-1111-1111-111111111111';
  const studentId = 's1111111-1111-1111-1111-111111111111';
  const classId = 'c1111111-1111-1111-1111-111111111111';
  const meetingId = 'm1111111-1111-1111-1111-111111111111';

  beforeEach(() => {
    mockService = {
      createMeeting: jest.fn(),
      getMeetingsByClass: jest.fn(),
      getMeetingDetail: jest.fn(),
      joinMeeting: jest.fn(),
      updateMeeting: jest.fn(),
      closeMeeting: jest.fn(),
      getMeetingAttendances: jest.fn(),
    };
    controller = new MeetingsController(
      mockService as unknown as MeetingsService,
    );
  });

  it('createMeeting should delegate to service', async () => {
    const dto = { title: 'Session 1', startTime: '2026-11-20T19:30:00.000Z' };
    mockService.createMeeting.mockResolvedValue({
      id: meetingId,
      title: 'Session 1',
    });

    const res = await controller.createMeeting(teacherId, classId, dto);
    expect(res.id).toBe(meetingId);
    expect(mockService.createMeeting).toHaveBeenCalledWith(
      teacherId,
      classId,
      dto,
    );
  });

  it('getMeetingsByClass should delegate to service', async () => {
    mockService.getMeetingsByClass.mockResolvedValue([]);

    const res = await controller.getMeetingsByClass(
      classId,
      studentId,
      Role.student,
    );
    expect(res).toEqual([]);
    expect(mockService.getMeetingsByClass).toHaveBeenCalledWith(
      classId,
      studentId,
      Role.student,
    );
  });

  it('joinMeeting should delegate to service', async () => {
    mockService.joinMeeting.mockResolvedValue({ token: 'jwt-sample' });

    const res = await controller.joinMeeting(
      meetingId,
      studentId,
      Role.student,
    );
    expect(res.token).toBe('jwt-sample');
    expect(mockService.joinMeeting).toHaveBeenCalledWith(
      meetingId,
      studentId,
      Role.student,
    );
  });

  it('updateMeeting should delegate to service', async () => {
    const updateDto = { title: 'Updated Title' };
    mockService.updateMeeting.mockResolvedValue({
      id: meetingId,
      title: 'Updated Title',
    });

    const res = await controller.updateMeeting(
      meetingId,
      teacherId,
      Role.teacher,
      updateDto,
    );
    expect(res.title).toBe('Updated Title');
    expect(mockService.updateMeeting).toHaveBeenCalledWith(
      meetingId,
      teacherId,
      Role.teacher,
      updateDto,
    );
  });

  it('closeMeeting should delegate to service', async () => {
    mockService.closeMeeting.mockResolvedValue({
      id: meetingId,
      isLive: false,
    });

    const res = await controller.closeMeeting(
      meetingId,
      teacherId,
      Role.teacher,
      {
        recordingUrl: 'https://video.url',
      },
    );
    expect(res.isLive).toBe(false);
    expect(mockService.closeMeeting).toHaveBeenCalledWith(
      meetingId,
      teacherId,
      Role.teacher,
      {
        recordingUrl: 'https://video.url',
      },
    );
  });

  it('getMeetingAttendances should delegate to service', async () => {
    mockService.getMeetingAttendances.mockResolvedValue([]);

    const res = await controller.getMeetingAttendances(meetingId, teacherId);
    expect(res).toEqual([]);
    expect(mockService.getMeetingAttendances).toHaveBeenCalledWith(
      meetingId,
      teacherId,
    );
  });
});
