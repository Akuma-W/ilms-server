import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';
import { IMeetingProvider } from '../interfaces/meeting-provider.interface';
import { MeetingTokenPayload } from '../interfaces/meeting-token-payload.interface';
import { MeetingTokenResult } from '../interfaces/meeting-token-result.interface';

// LiveKit WebRTC provider generating room access tokens and managing sessions
@Injectable()
export class LiveKitProvider implements IMeetingProvider {
  private readonly livekitUrl: string;
  private readonly apiKey: string;
  private readonly apiSecret: string;

  constructor(private readonly config: ConfigService) {
    this.livekitUrl =
      this.config.get<string>('livekit.url') || 'ws://localhost:7880';
    this.apiKey = this.config.get<string>('livekit.apiKey') || 'devkey';
    this.apiSecret = this.config.get<string>('livekit.apiSecret') || 'secret';
  }

  // Generates JWT access token with designated classroom permissions
  async generateToken(
    payload: MeetingTokenPayload,
  ): Promise<MeetingTokenResult> {
    const at = new AccessToken(this.apiKey, this.apiSecret, {
      identity: payload.participantId,
      name: payload.participantName,
      ttl: '6h',
    });

    at.addGrant({
      roomJoin: true,
      room: payload.roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
      roomAdmin: payload.isTeacher,
    });

    const token = await at.toJwt();

    return {
      token,
      serverUrl: this.livekitUrl,
      roomName: payload.roomName,
    };
  }

  // Closes or revokes active livekit room session across LiveKit server
  async closeRoom(roomName: string): Promise<void> {
    try {
      const httpUrl = this.livekitUrl
        .replace(/^ws:\/\//, 'http://')
        .replace(/^wss:\/\//, 'https://');
      const roomService = new RoomServiceClient(
        httpUrl,
        this.apiKey,
        this.apiSecret,
      );
      await roomService.deleteRoom(roomName);
    } catch {
      // Room may already be closed or not established on LiveKit server
    }
  }
}
