import { ConfigService } from '@nestjs/config';
import { MeetingFacade } from './meeting.facade';
import { LiveKitProvider } from './providers/livekit.provider';

describe('MeetingFacade', () => {
  let facade: MeetingFacade;
  let mockLiveKitProvider: {
    generateToken: jest.Mock;
    closeRoom: jest.Mock;
  };

  beforeEach(() => {
    mockLiveKitProvider = {
      generateToken: jest.fn(),
      closeRoom: jest.fn(),
    };
    facade = new MeetingFacade(
      mockLiveKitProvider as unknown as LiveKitProvider,
    );
  });

  it('should delegate token generation to livekit provider', async () => {
    const payload = {
      roomName: 'room-1',
      participantId: 'p-1',
      participantName: 'Student A',
      isTeacher: false,
    };
    mockLiveKitProvider.generateToken.mockResolvedValue({
      token: 'jwt-token',
      serverUrl: 'ws://localhost:7880',
      roomName: 'room-1',
    });

    const res = await facade.generateJoinToken(payload);
    expect(res.token).toBe('jwt-token');
    expect(mockLiveKitProvider.generateToken).toHaveBeenCalledWith(payload);
  });

  it('should delegate closeRoom to livekit provider', async () => {
    mockLiveKitProvider.closeRoom.mockResolvedValue(undefined);

    await facade.closeRoom('room-1');
    expect(mockLiveKitProvider.closeRoom).toHaveBeenCalledWith('room-1');
  });
});

describe('LiveKitProvider', () => {
  let provider: LiveKitProvider;
  let mockConfig: { get: jest.Mock };

  beforeEach(() => {
    mockConfig = {
      get: jest.fn((key: string) => {
        if (key === 'livekit.url') return 'ws://localhost:7880';
        if (key === 'livekit.apiKey') return 'devkey';
        if (key === 'livekit.apiSecret') return 'secret';
        return undefined;
      }),
    };
    provider = new LiveKitProvider(mockConfig as unknown as ConfigService);
  });

  it('should generate valid token structure', async () => {
    const res = await provider.generateToken({
      roomName: 'room-test',
      participantId: 'user-1',
      participantName: 'Teacher A',
      isTeacher: true,
    });

    expect(res.roomName).toBe('room-test');
    expect(res.serverUrl).toBe('ws://localhost:7880');
    expect(typeof res.token).toBe('string');
    expect(res.token.length).toBeGreaterThan(10);
  });
});
