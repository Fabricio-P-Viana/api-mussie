// tasks/tasks.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksService } from './tasks.service';
import { User } from '../users/entities/user.entity';
import { ReportsService } from '../reports/reports.service';
import { MailService } from 'src/mail/mail.service';
import { OrdersModule } from 'src/orders/orders.module';
import { IngredientsModule } from 'src/ingredients/ingredients.module';
import { ReportsModule } from 'src/reports/reports.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    OrdersModule,
    IngredientsModule, // Add this
    ReportsModule, // Add this to ensure all dependencies are available
  ],
  providers: [
    TasksService,
    MailService,
    // ReportsService, // Remove this if you're importing ReportsModule
  ],
})
export class TasksModule {}