import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { Notification } from './entities/notifications.entity';
import { Ingredient } from '../ingredients/entities/ingredient.entity';
import { User } from '../users/entities/user.entity';
import { ReportsService } from '../reports/reports.service';
import { QueuesModule } from '../queues/queues.module';
import { Order } from 'src/orders/entities/order.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, Ingredient, User,Order]),
    QueuesModule,
  ],
  providers: [NotificationsService, ReportsService],
  controllers: [NotificationsController],
  exports: [NotificationsService, ReportsService],
})
export class NotificationsModule {}