import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { Order } from './entities/order.entity';
import { RecipesModule } from '../recipes/recipes.module';

@Module({
  imports: [TypeOrmModule.forFeature([Order]), RecipesModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}