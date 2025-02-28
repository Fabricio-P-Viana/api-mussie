import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Recipe } from './entities/recipe.entity';
import { RecipeIngredient } from './entities/recipe-ingredient.entity';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { IngredientsService } from '../ingredients/ingredients.service';
import { User } from '../users/entities/user.entity';

@Injectable()
export class RecipesService {
  constructor(
    @InjectRepository(Recipe)
    private recipeRepository: Repository<Recipe>,
    @InjectRepository(RecipeIngredient)
    private recipeIngredientRepository: Repository<RecipeIngredient>,
    private ingredientsService: IngredientsService,
  ) {}

  async create(
    createRecipeDto: CreateRecipeDto,
    imagePath: string | undefined,
    user: User
  ): Promise<Recipe | null> {
    try {
      if (createRecipeDto.ingredients.length === 0) {
        throw new BadRequestException('A receita deve ter pelo menos um ingrediente');
      }
  
      const recipe = this.recipeRepository.create({
        name: createRecipeDto.name,
        servings: createRecipeDto.servings,
        image: imagePath, // Já recebemos o caminho pronto
        preparationTime: createRecipeDto.preparationTime,
        description: createRecipeDto.description,
        price: createRecipeDto.price,
        user,
      });
      const savedRecipe = await this.recipeRepository.save(recipe);
  
      const recipeIngredients = await Promise.all(
        createRecipeDto.ingredients.map(async (ing) => {
          const ingredient = await this.ingredientsService.findOne(ing.ingredientId);
          if (!ingredient) throw new BadRequestException(`Ingrediente ${ing.ingredientId} não encontrado`);
  
          const recipeIngredient = new RecipeIngredient();
          recipeIngredient.recipe = savedRecipe;
          recipeIngredient.ingredient = ingredient;
          recipeIngredient.amount = ing.amount;
          return recipeIngredient;
        }),
      );
      await this.recipeIngredientRepository.save(recipeIngredients);
  
      return await this.findOne(savedRecipe.id, user.id);
    } catch (error) {
      console.error('Erro ao criar receita:', error);
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Erro ao criar receita');
    }
  }

  async findAll(pagination: { skip: number; take: number }, userId: number): Promise<{ data: Recipe[]; total: number }> {
    try {
      const [data, total] = await this.recipeRepository.findAndCount({
        where: { user: { id: userId } },
        skip: pagination.skip,
        take: pagination.take,
        relations: ['ingredients', 'ingredients.ingredient'],
      });
      return { data, total };
    } catch (error) {
      console.error('Erro ao listar receitas:', error);
      throw new InternalServerErrorException('Erro ao buscar receitas');
    }
  }

  async findOne(id: number, userId: number): Promise<Recipe | null> {
    try {
      const recipe = await this.recipeRepository.findOne({
        where: { id, user: { id: userId } },
        relations: ['ingredients', 'ingredients.ingredient'],
      });
      if (!recipe) {
        throw new BadRequestException(`Receita com ID ${id} não encontrada ou não pertence ao usuário`);
      }
      return recipe;
    } catch (error) {
      console.error('Erro ao buscar receita:', error);
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Erro ao buscar receita');
    }
  }

  async executeRecipe(recipeId: number, servings: number, userId: number) {
    try {
      const recipe = await this.findOne(recipeId, userId);
      if (!recipe) throw new BadRequestException('Receita não encontrada ou não pertence ao usuário');

      const factor = servings / recipe.servings;

      for (const recipeIngredient of recipe.ingredients) {
        const ingredient = await this.ingredientsService.findOne(recipeIngredient.ingredient.id);
        if (!ingredient) throw new BadRequestException(`Ingrediente ${recipeIngredient.ingredient.id} não encontrado`);

        const baseAmount = recipeIngredient.amount * factor;
        const fixedWaste = baseAmount * ingredient.fixedWasteFactor;
        const variableWaste = baseAmount * ingredient.variableWasteFactor;
        const realConsumption = baseAmount + fixedWaste + variableWaste;

        if (ingredient.stock < realConsumption) {
          throw new BadRequestException(`Estoque insuficiente para ${ingredient.name}: ${ingredient.stock} disponível, ${realConsumption} necessário`);
        }

        ingredient.stock -= realConsumption;
        await this.ingredientsService.update(ingredient.id, { stock: ingredient.stock });
      }
      return { message: 'Receita executada e estoque atualizado' };
    } catch (error) {
      console.error('Erro ao executar receita:', error);
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Erro ao executar receita');
    }
  }
}