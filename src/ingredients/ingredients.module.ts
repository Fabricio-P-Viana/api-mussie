import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IngredientsService } from './ingredients.service';
import { IngredientsController } from './ingredients.controller';
import { Ingredient } from './entities/ingredient.entity';
import { StockTransaction } from './entities/stock-transaction.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Ingredient,StockTransaction])],
  controllers: [IngredientsController],
  providers: [IngredientsService],
  exports: [IngredientsService],
})
export class IngredientsModule {}