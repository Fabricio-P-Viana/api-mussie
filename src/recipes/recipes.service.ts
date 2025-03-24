import { Injectable, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Recipe } from './entities/recipe.entity';
import { RecipeIngredient } from './entities/recipe-ingredient.entity';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { IngredientsService } from '../ingredients/ingredients.service';
import { User } from '../users/entities/user.entity';
import { StockTransaction, TransactionType } from 'src/ingredients/entities/stock-transaction.entity';

@Injectable()
export class RecipesService {
  constructor(
    @InjectRepository(Recipe)
    private recipeRepository: Repository<Recipe>,
    @InjectRepository(RecipeIngredient)
    private recipeIngredientRepository: Repository<RecipeIngredient>,
    private ingredientsService: IngredientsService,
    private dataSource: DataSource,
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
      cost: 0, 
      showInPortifolio: createRecipeDto.showInPortifolio ?? false,
      preparationMode: createRecipeDto.preparationMode ?? '',
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
    if (!updatedRecipe) return null;
    updatedRecipe.cost = await this.calculateRecipeCost(updatedRecipe);
    await this.recipeRepository.save(updatedRecipe);

    return updatedRecipe;
  }

  async calculateRecipeCost(recipe: Recipe): Promise<number> {
    let totalCost = 0;
    for (const recipeIngredient of recipe.ingredients) {
      const ingredient = recipeIngredient.ingredient;
      const amountInBaseUnit = recipeIngredient.amount;
      const costPerUnit = ingredient.price; 
      totalCost += (amountInBaseUnit / 1000) * costPerUnit;
    }
    return totalCost / recipe.servings; 
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

  async executeRecipe(recipeId: number, servings: number, userId: number): Promise<{ message: string }> {
    const logger = new Logger('RecipesService.executeRecipe');
    logger.log(`Iniciando execução da receita ID ${recipeId} para ${servings} porções`);
    logger.debug(`Parâmetros recebidos - recipeId: ${recipeId}, servings: ${servings}, userId: ${userId}`);

    const recipe = await this.findOne(recipeId, userId);
    if (!recipe) {
      logger.error(`Receita ID ${recipeId} não encontrada para o usuário ${userId}`);
      throw new BadRequestException('Receita não encontrada');
    }
    logger.debug(`Receita encontrada: ${JSON.stringify({ id: recipe.id, servings: recipe.servings, ingredientes: recipe.ingredients.length })}`);

    const factor = servings / recipe.servings;
    if (factor <= 0 || !Number.isFinite(factor)) {
      logger.error(`Fator de conversão inválido: ${factor}`);
      throw new BadRequestException('Fator de conversão inválido');
    }
    logger.log(`Fator de conversão calculado: ${factor}`);

    await this.dataSource.transaction(async (manager) => {
      logger.debug('Transação iniciada para execução da receita');
      for (const [index, recipeIngredient] of recipe.ingredients.entries()) {
        logger.debug(`Processando ingrediente ${index + 1} de ${recipe.ingredients.length}`);
        const ingredient = await this.ingredientsService.findOne(recipeIngredient.ingredient.id);
        if (!ingredient) {
          logger.error(`Ingrediente ${recipeIngredient.ingredient.id} não encontrado`);
          throw new BadRequestException(`Ingrediente ${recipeIngredient.ingredient.id} não encontrado`);
        }
        logger.debug(`Detalhes do ingrediente: ${JSON.stringify({ id: ingredient.id, nome: ingredient.name, estoque: ingredient.stock })}`);

        const baseAmount = Number((recipeIngredient.amount * factor).toFixed(2));
        logger.log(`Processando ingrediente ${ingredient.name}: baseAmount ${baseAmount}`);

        const fixedWaste = Number((baseAmount * ingredient.fixedWasteFactor).toFixed(2));
        const variableWaste = Number((baseAmount * ingredient.variableWasteFactor).toFixed(2));
        const realConsumption = Number((baseAmount + fixedWaste + variableWaste).toFixed(2));
        logger.log(`Ingrediente ${ingredient.name}: fixedWaste ${fixedWaste}, variableWaste ${variableWaste}, realConsumption ${realConsumption}`);

        if (ingredient.stock < realConsumption) {
          logger.error(`Estoque insuficiente para ${ingredient.name}. Necessário: ${realConsumption}, Disponível: ${ingredient.stock}`);
          throw new BadRequestException(
            `Estoque insuficiente para ${ingredient.name}. Necessário: ${realConsumption}, Disponível: ${ingredient.stock}`
          );
        }

        logger.debug(`Estoque antes da atualização de ${ingredient.name}: ${ingredient.stock}`);
        ingredient.stock = Number((ingredient.stock - realConsumption).toFixed(2));
        logger.debug(`Estoque após a atualização de ${ingredient.name}: ${ingredient.stock}`);
        await manager.save(ingredient);
        logger.debug(`Ingrediente ${ingredient.name} salvo com novo estoque`);

        const stockTransaction = manager.create(StockTransaction, {
          ingredient: { id: ingredient.id },
          quantity: realConsumption,
          type: TransactionType.EXIT,
          description: `Consumo na execução da receita ${recipe.name} (${servings} porções)`,
          user: { id: userId },
        });
        logger.debug(`Criada transação de estoque: ${JSON.stringify({ ingredientId: ingredient.id, quantity: realConsumption, type: TransactionType.EXIT })}`);
        await manager.save(stockTransaction);
        logger.debug(`Transação de estoque para ${ingredient.name} registrada com sucesso`);
      }
      logger.debug('Transação concluída para execução da receita');
    });

    logger.log(`Receita ${recipe.name} executada com sucesso e estoque atualizado`);
    return { message: 'Receita executada e estoque atualizado com sucesso' };
  }

  async update(id: number, updateRecipeDto: CreateRecipeDto, imagePath: string | undefined, user: User): Promise<Recipe | null> {
    // Busca a receita existente com os ingredientes atuais
    const recipe = await this.recipeRepository.findOne({
      where: { id, user: { id: user.id } },
      relations: ['ingredients', 'ingredients.ingredient'],
    });
    if (!recipe) {
      throw new BadRequestException(`Receita com ID ${id} não encontrada ou não pertence ao usuário`);
    }

    // Atualiza os campos básicos da receita
    recipe.name = updateRecipeDto.name;
    recipe.servings = updateRecipeDto.servings;
    recipe.price = updateRecipeDto.price;
    recipe.preparationTime = updateRecipeDto.preparationTime ?? recipe.preparationTime;
    recipe.description = updateRecipeDto.description ?? recipe.description;
    recipe.showInPortifolio = updateRecipeDto.showInPortifolio ?? recipe.showInPortifolio;
    recipe.preparationMode = updateRecipeDto.preparationMode ?? recipe.preparationMode;
    if (imagePath) {
      recipe.image = imagePath;
    }

    // Mapa dos ingredientes enviados (do frontend)
    const newIngredientsMap = new Map<number, number>(
      updateRecipeDto.ingredients.map(ing => [ing.ingredientId, ing.amount])
    );

    // Mapa dos ingredientes existentes no banco
    const existingIngredientsMap = new Map<number, { id: number; amount: number }>(
      recipe.ingredients.map(ing => [ing.ingredient.id, { id: ing.id, amount: ing.amount }])
    );

    // Identifica ingredientes a remover (existentes, mas não enviados)
    const ingredientsToRemove = recipe.ingredients.filter(
      ing => !newIngredientsMap.has(ing.ingredient.id)
    );

    // Remove os ingredientes excluídos
    if (ingredientsToRemove.length > 0) {
      await this.recipeIngredientRepository.delete(
        ingredientsToRemove.map(ing => ing.id)
      );
    }

    // Identifica ingredientes a adicionar ou atualizar
    const ingredientsToUpsert: RecipeIngredient[] = [];
    for (const [ingredientId, newAmount] of newIngredientsMap) {
      const existingIng = existingIngredientsMap.get(ingredientId);
      if (existingIng) {
        // Atualiza a quantidade de um ingrediente existente
        if (existingIng.amount !== newAmount) {
          const recipeIngredient = recipe.ingredients.find(ing => ing.id === existingIng.id)!;
          recipeIngredient.amount = newAmount;
          ingredientsToUpsert.push(recipeIngredient);
        }
      } else {
        // Adiciona um novo ingrediente
        const ingredient = await this.ingredientsService.findOne(ingredientId);
        if (!ingredient) {
          throw new BadRequestException(`Ingrediente ${ingredientId} não encontrado`);
        }
        const newRecipeIngredient = this.recipeIngredientRepository.create({
          recipe,
          ingredient,
          amount: newAmount,
        });
        ingredientsToUpsert.push(newRecipeIngredient);
      }
    }

    // Salva as alterações nos ingredientes (adicionados e atualizados)
    if (ingredientsToUpsert.length > 0) {
      await this.recipeIngredientRepository.save(ingredientsToUpsert);
    }

    // Recalcula o custo da receita
    recipe.cost = await this.calculateRecipeCost(recipe);

    // Salva a receita atualizada
    const updatedRecipe = await this.recipeRepository.save(recipe);

    // Recarrega a receita com os ingredientes atualizados para retorno
    return this.findOne(id, user.id);
  }
}