import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Recipe } from './entities/recipe.entity';
import { RecipeIngredient } from './entities/recipe-ingredient.entity';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { IngredientsService } from '../ingredients/ingredients.service';

@Injectable()
export class RecipesService {
  constructor(
    @InjectRepository(Recipe)
    private recipeRepository: Repository<Recipe>,
    @InjectRepository(RecipeIngredient)
    private recipeIngredientRepository: Repository<RecipeIngredient>,
    private ingredientsService: IngredientsService,
  ) {}

  async create(createRecipeDto: CreateRecipeDto, image?: Express.Multer.File): Promise<Recipe | null> { // Ajustado para permitir null
    const recipe = this.recipeRepository.create({
      name: createRecipeDto.name,
      servings: createRecipeDto.servings || 1,
      image: image ? `/uploads/${image.filename}` : undefined,
    });
    const savedRecipe = await this.recipeRepository.save(recipe);

    const recipeIngredients = await Promise.all(
      createRecipeDto.ingredients.map(async (ing) => {
        const ingredient = await this.ingredientsService.findOne(ing.ingredientId);
        if (!ingredient) throw new Error(`Ingrediente ${ing.ingredientId} não encontrado`);

        const recipeIngredient = new RecipeIngredient();
        recipeIngredient.recipe = savedRecipe;
        recipeIngredient.ingredient = ingredient;
        recipeIngredient.amount = ing.amount;
        return recipeIngredient;
      })
    );
    await this.recipeIngredientRepository.save(recipeIngredients);

    return this.findOne(savedRecipe.id);
  }

  findAll(pagination: { skip: number; take: number }): Promise<{ data: Recipe[]; total: number }> {
    return this.recipeRepository
      .findAndCount({
        skip: pagination.skip,
        take: pagination.take,
        relations: ['ingredients', 'ingredients.ingredient'],
      })
      .then(([data, total]) => ({ data, total }));
  }

  findOne(id: number): Promise<Recipe | null> { // Ajustado para permitir null
    return this.recipeRepository.findOne({
      where: { id },
      relations: ['ingredients', 'ingredients.ingredient'],
    });
  }

  async executeRecipe(recipeId: number, servings: number) {
    const recipe = await this.findOne(recipeId);
    if (!recipe) throw new Error('Receita não encontrada');

    const factor = servings / recipe.servings;

    for (const recipeIngredient of recipe.ingredients) {
      const ingredient = await this.ingredientsService.findOne(recipeIngredient.ingredient.id);
      if (!ingredient) throw new Error(`Ingrediente ${recipeIngredient.ingredient.id} não encontrado`);

      const baseAmount = recipeIngredient.amount * factor;
      const fixedWaste = baseAmount * ingredient.fixedWasteFactor;
      const variableWaste = baseAmount * ingredient.variableWasteFactor;
      const realConsumption = baseAmount + fixedWaste + variableWaste;

      if (ingredient.stock < realConsumption) {
        throw new Error(`Estoque insuficiente para ${ingredient.name}`);
      }

      ingredient.stock -= realConsumption;
      await this.ingredientsService.update(ingredient.id, { stock: ingredient.stock });
    }
    return { message: 'Receita executada e estoque atualizado' };
  }
}