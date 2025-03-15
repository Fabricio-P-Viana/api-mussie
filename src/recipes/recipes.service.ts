import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Recipe } from './entities/recipe.entity';
import { RecipeIngredient } from './entities/recipe-ingredient.entity';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { IngredientsService } from '../ingredients/ingredients.service';
import { User } from '../users/entities/user.entity';
import { TransactionType } from 'src/ingredients/entities/stock-transaction.entity';

@Injectable()
export class RecipesService {
  constructor(
    @InjectRepository(Recipe)
    private recipeRepository: Repository<Recipe>,
    @InjectRepository(RecipeIngredient)
    private recipeIngredientRepository: Repository<RecipeIngredient>,
    private ingredientsService: IngredientsService,
  ) {}

  async create(createRecipeDto: CreateRecipeDto, imagePath: string | undefined, user: User): Promise<Recipe | null> {
    const recipe = this.recipeRepository.create({
      name: createRecipeDto.name,
      servings: createRecipeDto.servings,
      image: imagePath,
      preparationTime: createRecipeDto.preparationTime,
      description: createRecipeDto.description,
      price: createRecipeDto.price,
      user,
      cost: 0, // Inicializa como 0, será calculado abaixo
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
  
    const updatedRecipe = await this.findOne(savedRecipe.id, user.id);
    if(!updatedRecipe) return null
    updatedRecipe.cost = await this.calculateRecipeCost(updatedRecipe);
    await this.recipeRepository.save(updatedRecipe);
  
    return updatedRecipe;
  }
  
  async calculateRecipeCost(recipe: Recipe): Promise<number> {
    let totalCost = 0;
    for (const recipeIngredient of recipe.ingredients) {
      const ingredient = recipeIngredient.ingredient;
      const amountInBaseUnit = recipeIngredient.amount; // Assumindo que a unidade já está convertida
      const costPerUnit = ingredient.price; // Preço por unidade base (ex.: R$/kg)
      totalCost += (amountInBaseUnit / 1000) * costPerUnit; // Converte para base (ex.: g para kg)
    }
    return totalCost / recipe.servings; // Custo por porção
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
    const recipe = await this.findOne(recipeId, userId);
    if (!recipe) throw new BadRequestException('Receita não encontrada ou não pertence ao usuário');

    const factor = servings / recipe.servings;
    console.log('Fator de conversão:', factor);
    

    for (const recipeIngredient of recipe.ingredients) {
      
      const ingredient = await this.ingredientsService.findOne(recipeIngredient.ingredient.id);
      if(ingredient === null) return
      const baseAmount = recipeIngredient.amount * factor;
      const fixedWaste = baseAmount * ingredient.fixedWasteFactor;
      const variableWaste = baseAmount * ingredient.variableWasteFactor;
      const realConsumption = baseAmount + fixedWaste + variableWaste;
      console.log(`Consumo real de ${ingredient.name}: ${realConsumption}`);
      console.log(`Estoque atual de ${ingredient.name}: ${ingredient.stock}`);;
      
      
      if (ingredient.stock < realConsumption) {
        throw new BadRequestException(`Estoque insuficiente para ${ingredient.name}`);
      }

      ingredient.stock -= realConsumption;
      await this.ingredientsService.update(ingredient.id, { stock: ingredient.stock });
      await this.ingredientsService.recordStockTransaction(
        ingredient.id,
        TransactionType.EXIT,
        realConsumption,
        `Consumo na execução da receita ${recipe.name}`,
      );
    }
    return { message: 'Receita executada e estoque atualizado' };
  }
}