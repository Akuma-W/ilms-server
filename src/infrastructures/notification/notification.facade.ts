import { Injectable } from '@nestjs/common';
import { EmailService } from './email/email.service';
import { SmsService } from './sms/sms.service';
import { NotificationPayload } from './interfaces/notification-payload.interface';
import { EmailTemplate } from './interfaces/email-template.interface';

// Facade coordinating notification channels (Email, SMS) and OTP routing
@Injectable()
export class NotificationFacade {
  constructor(
    private readonly email: EmailService,
    private readonly sms: SmsService,
  ) {}

  // Dispatches an email notification
  async sendEmail(payload: NotificationPayload): Promise<void> {
    return this.email.send(payload);
  }

  // Dispatches email using reusable EmailTemplate
  async sendEmailTemplate(to: string, template: EmailTemplate): Promise<void> {
    return this.sendEmail({
      to,
      subject: template.subject,
      content: template.content,
      html: template.content,
    });
  }

  // Dispatches an SMS notification
  async sendSms(payload: NotificationPayload): Promise<void> {
    return this.sms.send(payload);
  }
}
