import { Injectable } from '@nestjs/common';
import { EmailService } from './email/email.service';
import { SmsService } from './sms/sms.service';
import { NotificationPayload } from './interfaces/notification-payload.interface';

@Injectable()
export class NotificationFacade {
  constructor(
    private readonly email: EmailService,
    private readonly sms: SmsService,
  ) {}

  async sendEmail(payload: NotificationPayload): Promise<void> {
    return this.email.send(payload);
  }

  async sendSms(payload: NotificationPayload): Promise<void> {
    return this.sms.send(payload);
  }

  async sendOtp(to: string, otp: string): Promise<void> {
    const content = `Your OTP code is ${otp}. It will expire in 5 minutes.`;

    if (to.includes('@')) {
      return this.sendEmail({
        to,
        subject: 'OTP Verification',
        content,
      });
    }
    return this.sendSms({
      to,
      content,
    });
  }
}

