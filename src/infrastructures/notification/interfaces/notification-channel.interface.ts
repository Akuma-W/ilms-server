import { NotificationPayload } from './notification-payload.interface';

export interface NotificationChannel {
  send(payload: NotificationPayload): Promise<void>;
}
