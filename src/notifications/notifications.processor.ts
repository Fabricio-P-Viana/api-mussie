import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Processor('notifications')
export class NotificationsProcessor {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @Process('create')
  async handleNotification(job: Job<{ 
    userId: number, 
    ingredientId: number, 
    type: string, 
    message: string 
  }>) {
    try {
      const { userId, ingredientId, type, message } = job.data;
      await this.notificationsService.createNotification(
        userId,
        ingredientId,
        type,
        message
      );
      this.logger.log(`Notification created for user ${userId}`);
    } catch (error) {
      this.logger.error(`Error creating notification: ${error.message}`);
      throw error;
    }
  }
}