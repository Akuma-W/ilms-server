import { MeetingTokenPayload } from './meeting-token-payload.interface';
import { MeetingTokenResult } from './meeting-token-result.interface';

export interface IMeetingProvider {
  generateToken(payload: MeetingTokenPayload): Promise<MeetingTokenResult>;
  closeRoom(roomName: string): Promise<void>;
}
