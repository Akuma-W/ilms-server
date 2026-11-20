import { Injectable } from '@nestjs/common';
import { LiveKitProvider } from './providers/livekit.provider';
import { MeetingTokenPayload } from './interfaces/meeting-token-payload.interface';
import { MeetingTokenResult } from './interfaces/meeting-token-result.interface';

// Meeting facade orchestrating video conference providers (LiveKit, Google Meet, Jitsi)
@Injectable()
export class MeetingFacade {
  constructor(private readonly livekitProvider: LiveKitProvider) {}

  // Dispatches token generation to active meeting provider
  async generateJoinToken(
    payload: MeetingTokenPayload,
  ): Promise<MeetingTokenResult> {
    return this.livekitProvider.generateToken(payload);
  }

  // Closes designated room across meeting provider
  async closeRoom(roomName: string): Promise<void> {
    return this.livekitProvider.closeRoom(roomName);
  }
}
