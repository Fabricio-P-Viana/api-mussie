import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ReportsService } from '../reports/reports.service';
import { User } from '../users/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);


  constructor(
    private readonly reportsService: ReportsService, 
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  @Cron(CronExpression.EVERY_WEEK)
  async handleWeeklyReports() {
    this.logger.log('Starting weekly reports sending...');
    
    const users = await this.userRepository.find();
    for (const user of users) {
      try {
        if (user.email) {
          await this.reportsService.sendWeeklyReportEmail(user.id);
          this.logger.log(`Report sent to ${user.email}`);
        }
      } catch (error) {
        this.logger.error(`Error sending report to ${user.email}: ${error.message}`);
      }
    }
    
    this.logger.log('Weekly reports sending completed');
  }
}