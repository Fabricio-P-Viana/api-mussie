// queues/queues.module.ts
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { MailProcessor } from './mail.processor';
import { MailService } from '../notifications/mail.service';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'mailQueue',
    }),
  ],
  providers: [MailProcessor, MailService, ConfigService],
  exports: [BullModule],
})
export class QueuesModule {}