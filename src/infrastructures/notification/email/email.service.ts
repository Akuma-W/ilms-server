import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';
import { NotificationChannel } from '../interfaces/notification-channel.interface';
import { NotificationPayload } from '../interfaces/notification-payload.interface';

@Injectable()
export class EmailService implements NotificationChannel {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('infra.email.host') || this.config.get<string>('EMAIL_HOST');
    const port = Number(this.config.get('infra.email.port') || this.config.get('EMAIL_PORT') || 587);
    const user = this.config.get<string>('infra.email.user') || this.config.get<string>('EMAIL_USER');
    const pass = this.config.get<string>('infra.email.pass') || this.config.get<string>('EMAIL_PASS');

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: {
          user,
          pass,
        },
      });
    } else {
      this.logger.warn('Email service configuration missing. Emails will be logged to console in dev mode.');
    }
  }

  async send(payload: NotificationPayload): Promise<void> {
    if (!this.transporter) {
      this.logger.log(`[Email Simulation] To: ${payload.to} | Subject: ${payload.subject} | Content: ${payload.content}`);
      return;
    }

    const from = this.config.get<string>('infra.email.from') || this.config.get<string>('EMAIL_FROM') || 'noreply@ilms.local';
    await this.transporter.sendMail({
      from,
      to: payload.to,
      subject: payload.subject,
      text: payload.content,
    });

    this.logger.log(`Email sent to ${payload.to}`);
  }
}

