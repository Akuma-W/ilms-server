import { Test, TestingModule } from '@nestjs/testing';
import { NotificationFacade } from './notification.facade';
import { EmailService } from './email/email.service';
import { SmsService } from './sms/sms.service';
import { NotificationPayload } from './interfaces/notification-payload.interface';

describe('NotificationFacade', () => {
  let facade: NotificationFacade;
  let emailService: jest.Mocked<Partial<EmailService>>;
  let smsService: jest.Mocked<Partial<SmsService>>;

  beforeEach(async () => {
    emailService = {
      send: jest.fn().mockResolvedValue(undefined),
    };
    smsService = {
      send: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationFacade,
        {
          provide: EmailService,
          useValue: emailService,
        },
        {
          provide: SmsService,
          useValue: smsService,
        },
      ],
    }).compile();

    facade = module.get<NotificationFacade>(NotificationFacade);
  });

  it('should be defined', () => {
    expect(facade).toBeDefined();
  });

  it('should route email when sendEmail is called', async () => {
    const payload: NotificationPayload = {
      to: 'test@example.com',
      subject: 'Hello',
      content: 'World',
    };
    await facade.sendEmail(payload);
    expect(emailService.send).toHaveBeenCalledWith(payload);
  });

  it('should route sms when sendSms is called', async () => {
    const payload: NotificationPayload = {
      to: '+84901234567',
      content: 'Hello SMS',
    };
    await facade.sendSms(payload);
    expect(smsService.send).toHaveBeenCalledWith(payload);
  });
});
