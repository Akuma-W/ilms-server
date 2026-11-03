import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';
import { NotificationChannel } from '../interfaces/notification-channel.interface';
import { NotificationPayload } from '../interfaces/notification-payload.interface';

// Service sending SMS notifications via Twilio or logging in dev mode
@Injectable()
export class SmsService implements NotificationChannel {
  private readonly logger = new Logger(SmsService.name);
  private client: Twilio | null = null;

  constructor(private readonly config: ConfigService) {
    const accountSid =
      this.config.get<string>('infra.twilio.account_sid') ||
      this.config.get<string>('TWILIO_ACCOUNT_SID');
    const authToken =
      this.config.get<string>('infra.twilio.auth_token') ||
      this.config.get<string>('TWILIO_AUTH_TOKEN');

    if (accountSid && authToken) {
      this.client = new Twilio(accountSid, authToken);
    } else {
      this.logger.warn(
        'Twilio configuration missing. SMS will be logged to console in dev mode.',
      );
    }
  }

  // Sends an SMS text message or outputs simulation log
  async send(payload: NotificationPayload): Promise<void> {
    const from =
      this.config.get<string>('infra.twilio.from') ||
      this.config.get<string>('TWILIO_FROM_PHONE');

    if (!this.client || !from) {
      this.logger.log(
        `[SMS Simulation] To: ${payload.to} | Content: ${payload.content}`,
      );
      return;
    }

    await this.client.messages.create({
      body: payload.content,
      from,
      to: payload.to,
    });

    this.logger.log(`SMS sent to ${payload.to}`);
  }
}
