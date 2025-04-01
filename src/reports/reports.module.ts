// reports/reports.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { User } from '../users/entities/user.entity';
import { Ingredient } from '../ingredients/entities/ingredient.entity';
import { Order } from '../orders/entities/order.entity';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Ingredient, Order]),
    MailModule,
  ],
  providers: [ReportsService],
  controllers: [ReportsController],
  exports: [ReportsService, TypeOrmModule],
})
export class ReportsModule {}