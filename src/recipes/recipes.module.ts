import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecipesService } from './recipes.service';
import { RecipesController } from './recipes.controller';
import { Recipe } from './entities/recipe.entity';
import { RecipeIngredient } from './entities/recipe-ingredient.entity';
import { IngredientsModule } from '../ingredients/ingredients.module';
import { UploadsModule } from '../uploads/uploads.module';
import { StockTransaction } from 'src/ingredients/entities/stock-transaction.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Recipe, RecipeIngredient,StockTransaction]),
    IngredientsModule,
    UploadsModule,
  ],
  controllers: [RecipesController],
  providers: [RecipesService],
  exports: [RecipesService],
})
export class RecipesModule {}