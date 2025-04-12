// reports.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { Order } from '../orders/entities/order.entity';
import { Ingredient } from '../ingredients/entities/ingredient.entity';
import { User } from '../users/entities/user.entity';
import { QueuesModule } from 'src/queues/queues.module';

@Module({
  imports: [TypeOrmModule.forFeature([Order, Ingredient, User]),QueuesModule],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}