import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { MailService } from '../notifications/mail.service';

@Processor('mailQueue')
export class MailProcessor {
  private readonly logger = new Logger(MailProcessor.name);

  constructor(private readonly mailService: MailService) {}

  @Process('sendSalesReport')
  async handleSalesReport(job: Job<{ email: string; reportUrl: string }>) {
    try {
      await this.mailService.sendWeeklySalesReport(job.data.email, job.data.reportUrl);
      this.logger.log(`Email sent to ${job.data.email}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${job.data.email}`, error.stack);
      throw error;
    }
  }

  @Process('sendShoppingReport')
  async handleShoppingReport(job: Job<{ email: string; reportUrl: string }>) {
    try {
      await this.mailService.sendWeeklyShoppingReport(job.data.email, job.data.reportUrl);
      this.logger.log(`Email sent to ${job.data.email}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${job.data.email}`, error.stack);
      throw error;
    }
  }
}