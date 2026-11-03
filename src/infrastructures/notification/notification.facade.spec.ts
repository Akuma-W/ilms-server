import { Test, TestingModule } from '@nestjs/testing';
import { NotificationFacade } from './notification.facade';
import { EmailService } from './email/email.service';
import { SmsService } from './sms/sms.service';

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
    const payload = { to: 'test@example.com', subject: 'Hello', content: 'World' };
    await facade.sendEmail(payload);
    expect(emailService.send).toHaveBeenCalledWith(payload);
  });

  it('should route sms when sendSms is called', async () => {
    const payload = { to: '+84901234567', content: 'Hello SMS' };
    await facade.sendSms(payload);
    expect(smsService.send).toHaveBeenCalledWith(payload);
  });

  it('should route to email in sendOtp when recipient contains @', async () => {
    await facade.sendOtp('user@domain.com', '123456');
    expect(emailService.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'user@domain.com',
        subject: 'OTP Verification',
        content: expect.stringContaining('123456'),
      }),
    );
    expect(smsService.send).not.toHaveBeenCalled();
  });

  it('should route to sms in sendOtp when recipient is a phone number', async () => {
    await facade.sendOtp('0901234567', '654321');
    expect(smsService.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: '0901234567',
        content: expect.stringContaining('654321'),
      }),
    );
    expect(emailService.send).not.toHaveBeenCalled();
  });
});

