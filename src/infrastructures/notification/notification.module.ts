import { Global, Module } from '@nestjs/common';
import { EmailModule } from './email/email.module';
import { SmsModule } from './sms/sms.module';
import { NotificationFacade } from './notification.facade';

@Global()
@Module({
  imports: [EmailModule, SmsModule],
  providers: [NotificationFacade],
  exports: [NotificationFacade, EmailModule, SmsModule],
})
export class NotificationModule {}

