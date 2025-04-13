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
  private readonly logger = new Logger(RecipesService.name);

  constructor(
    @InjectRepository(Recipe)
    private recipeRepository: Repository<Recipe>,
    @InjectRepository(RecipeIngredient)
    private recipeIngredientRepository: Repository<RecipeIngredient>,
    @InjectRepository(StockTransaction)
    private stockTransactionRepository: Repository<StockTransaction>,
    private ingredientsService: IngredientsService,
    private dataSource: DataSource,
  ) {}

  /**
   * Cria uma nova receita com seus ingredientes
   * @param createRecipeDto DTO com os dados da receita
   * @param imagePath Caminho da imagem (opcional)
   * @param user Usuário que está criando a receita
   * @returns Receita criada com custo calculado
   */
  async create(createRecipeDto: CreateRecipeDto, imagePath: string | undefined, user: User): Promise<Recipe | null> {
    // Inicia uma transação para garantir consistência dos dados
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      // Cria a entidade Recipe com os dados básicos
      const recipe = this.recipeRepository.create({
        name: createRecipeDto.name,
        servings: createRecipeDto.servings,
        image: imagePath,
        preparationTime: createRecipeDto.preparationTime,
        description: createRecipeDto.description,
        price: createRecipeDto.price,
        user,
        cost: 0, // Inicialmente zero, será calculado depois
        showInPortifolio: createRecipeDto.showInPortifolio ?? false,
        preparationMode: createRecipeDto.preparationMode ?? '',
      });

      // Salva a receita no banco de dados
      const savedRecipe = await transactionalEntityManager.save(recipe);

      // Processa cada ingrediente da receita
      const recipeIngredients = await Promise.all(
        createRecipeDto.ingredients.map(async (ing) => {
          const ingredient = await this.ingredientsService.findOne(ing.ingredientId);
          if (!ingredient) {
            throw new BadRequestException(`Ingrediente ${ing.ingredientId} não encontrado`);
          }

          // Cria a relação entre receita e ingrediente
          const recipeIngredient = new RecipeIngredient();
          recipeIngredient.recipe = savedRecipe;
          recipeIngredient.ingredient = ingredient;
          recipeIngredient.amount = ing.amount;
          return recipeIngredient;
        }),
      );

      // Salva os ingredientes da receita
      await transactionalEntityManager.save(recipeIngredients);

      // Atualiza o custo da receita baseado nos ingredientes
      const updatedRecipe = await this.findOneWithIngredients(savedRecipe.id, user.id);
      if (!updatedRecipe) return null;

      // Calcula e atualiza o custo da receita
      updatedRecipe.cost = await this.calculateRecipeCost(updatedRecipe);
      await transactionalEntityManager.save(updatedRecipe);

      return updatedRecipe;
    });
  }

  /**
   * Calcula o custo real da receita por porção, considerando:
   * - O custo médio dos ingredientes baseado nas transações de entrada
   * - Os fatores de perda (fixa e variável)
   * @param recipe Receita com ingredientes carregados
   * @returns Custo por porção
   */
  async calculateRecipeCost(recipe: Recipe): Promise<number> {
    let totalCost = 0;

    // Para cada ingrediente da receita
    for (const recipeIngredient of recipe.ingredients) {
      const ingredient = recipeIngredient.ingredient;
      const amountInBaseUnit = recipeIngredient.amount; // em gramas ou ml

      // Obtém o custo médio do ingrediente baseado nas transações de entrada
      const averageCost = await this.getIngredientAverageCost(ingredient.id);
      
      // Calcula o custo considerando as perdas
      const fixedWaste = amountInBaseUnit * ingredient.fixedWasteFactor;
      const variableWaste = amountInBaseUnit * ingredient.variableWasteFactor;
      const totalAmountWithWaste = amountInBaseUnit + fixedWaste + variableWaste;
      
      // Converte para kg/l (assumindo que o preço está por kg/l)
      const cost = (totalAmountWithWaste / 1000) * averageCost;
      totalCost += cost;
    }

    // Retorna o custo por porção
    return totalCost / recipe.servings;
  }

  /**
   * Calcula o custo médio de um ingrediente baseado nas transações de entrada
   * @param ingredientId ID do ingrediente
   * @returns Custo médio por unidade (kg/l)
   */
  private async getIngredientAverageCost(ingredientId: number): Promise<number> {
    // Busca todas as transações de entrada para o ingrediente
    const entryTransactions = await this.stockTransactionRepository.find({
      where: {
        ingredient: { id: ingredientId },
        type: TransactionType.ENTRY,
      },
      order: { timestamp: 'DESC' }, // Mais recentes primeiro
    });

    if (entryTransactions.length === 0) {
      this.logger.warn(`Nenhuma transação de entrada encontrada para o ingrediente ${ingredientId}`);
      return 0;
    }

    // Calcula o custo médio ponderado
    let totalQuantity = 0;
    let totalValue = 0;

    for (const transaction of entryTransactions) {
      // Assumindo que o preço está na descrição no formato "Compra de X kg a R$ Y"
      // Isso pode ser ajustado conforme a estrutura real das transações
      const priceMatch = transaction.description?.match(/R\$\s?([\d,.]+)/);
      if (priceMatch) {
        const price = parseFloat(priceMatch[1].replace(',', '.'));
        totalValue += transaction.quantity * price;
        totalQuantity += transaction.quantity;
      }
    }

    // Se não encontrou preços nas descrições, usa o preço atual do ingrediente
    if (totalQuantity === 0) {
      const ingredient = await this.ingredientsService.findOne(ingredientId);
      return ingredient?.price || 0;
    }

    return totalValue / totalQuantity;
  }

  /**
   * Busca uma receita com seus ingredientes carregados
   * @param id ID da receita
   * @param userId ID do usuário
   * @returns Receita com ingredientes ou null se não encontrada
   */
  private async findOneWithIngredients(id: number, userId: number): Promise<Recipe | null> {
    try {
      return await this.recipeRepository.findOne({
        where: { id, user: { id: userId } },
        relations: ['ingredients', 'ingredients.ingredient'],
      });
    } catch (error) {
      this.logger.error(`Erro ao buscar receita ${id}: ${error.message}`);
      throw new InternalServerErrorException('Erro ao buscar receita');
    }
  }

  /**
   * Lista todas as receitas do usuário com paginação
   * @param pagination Objeto com skip e take para paginação
   * @param userId ID do usuário
   * @returns Lista de receitas e total
   */
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
      this.logger.error(`Erro ao listar receitas: ${error.message}`);
      throw new InternalServerErrorException('Erro ao buscar receitas');
    }
  }

  /**
   * Busca uma receita específica do usuário
   * @param id ID da receita
   * @param userId ID do usuário
   * @returns Receita encontrada
   * @throws BadRequestException se não encontrada
   */
  async findOne(id: number, userId: number): Promise<Recipe | null> {
    const recipe = await this.findOneWithIngredients(id, userId);
    if (!recipe) {
      throw new BadRequestException(`Receita com ID ${id} não encontrada ou não pertence ao usuário`);
    }
    return recipe;
  }

  /**
   * Executa uma receita, consumindo os ingredientes do estoque
   * @param recipeId ID da receita
   * @param servings Número de porções a serem preparadas
   * @param userId ID do usuário
   * @returns Mensagem de sucesso
   */
  async executeRecipe(recipeId: number, servings: number, userId: number): Promise<{ message: string }> {
    this.logger.log(`Iniciando execução da receita ID ${recipeId} para ${servings} porções`);

    // Busca a receita com ingredientes
    const recipe = await this.findOne(recipeId, userId);
    if (!recipe) {
      throw new BadRequestException('Receita não encontrada');
    }

    // Calcula o fator de conversão baseado nas porções
    const factor = servings / recipe.servings;
    if (factor <= 0 || !Number.isFinite(factor)) {
      throw new BadRequestException('Fator de conversão inválido');
    }

    // Executa em transação para garantir consistência
    await this.dataSource.transaction(async (manager) => {
      for (const recipeIngredient of recipe.ingredients) {
        const ingredient = await this.ingredientsService.findOne(recipeIngredient.ingredient.id);
        if (!ingredient) {
          throw new BadRequestException(`Ingrediente ${recipeIngredient.ingredient.id} não encontrado`);
        }

        // Calcula quantidades considerando perdas
        const baseAmount = Number((recipeIngredient.amount * factor).toFixed(2));
        const fixedWaste = Number((baseAmount * ingredient.fixedWasteFactor).toFixed(2));
        const variableWaste = Number((baseAmount * ingredient.variableWasteFactor).toFixed(2));
        const realConsumption = Number((baseAmount + fixedWaste + variableWaste).toFixed(2));

        // Verifica estoque
        if (ingredient.stock < realConsumption) {
          throw new BadRequestException(
            `Estoque insuficiente para ${ingredient.name}. Necessário: ${realConsumption}, Disponível: ${ingredient.stock}`
          );
        }

        // Atualiza estoque
        ingredient.stock = Number((ingredient.stock - realConsumption).toFixed(2));
        await manager.save(ingredient);

        // Registra transação de saída
        const stockTransaction = manager.create(StockTransaction, {
          ingredient: { id: ingredient.id },
          quantity: realConsumption,
          type: TransactionType.EXIT,
          description: `Consumo na execução da receita ${recipe.name} (${servings} porções)`,
          user: { id: userId },
        });
        await manager.save(stockTransaction);
      }
    });

    return { message: 'Receita executada e estoque atualizado com sucesso' };
  }

  /**
   * Atualiza uma receita existente
   * @param id ID da receita
   * @param updateRecipeDto DTO com dados atualizados
   * @param imagePath Caminho da nova imagem (opcional)
   * @param user Usuário que está atualizando
   * @returns Receita atualizada
   */
  async update(id: number, updateRecipeDto: CreateRecipeDto, imagePath: string | undefined, user: User): Promise<Recipe | null> {
    return this.dataSource.transaction(async (manager) => {
      // Busca a receita existente
      const recipe = await manager.findOne(Recipe, {
        where: { id, user: { id: user.id } },
        relations: ['ingredients', 'ingredients.ingredient'],
      });
      
      if (!recipe) {
        throw new BadRequestException(`Receita com ID ${id} não encontrada ou não pertence ao usuário`);
      }

      // Atualiza campos básicos
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

      // Salva a receita atualizada
      const savedRecipe = await manager.save(recipe);

      // Mapeia ingredientes novos e existentes
      const newIngredientsMap = new Map<number, number>(
        updateRecipeDto.ingredients.map(ing => [ing.ingredientId, ing.amount])
      );

      const existingIngredientsMap = new Map<number, { id: number; amount: number }>(
        recipe.ingredients.map(ing => [ing.ingredient.id, { id: ing.id, amount: ing.amount }])
      );

      // Remove ingredientes excluídos
      const ingredientsToRemove = recipe.ingredients.filter(
        ing => !newIngredientsMap.has(ing.ingredient.id)
      );
      
      if (ingredientsToRemove.length > 0) {
        await manager.delete(RecipeIngredient, ingredientsToRemove.map(ing => ing.id));
      }

      // Atualiza ou adiciona ingredientes
      for (const [ingredientId, newAmount] of newIngredientsMap.entries()) {
        const existingIng = existingIngredientsMap.get(ingredientId);
        
        if (existingIng) {
          // Atualiza quantidade se mudou
          if (existingIng.amount !== newAmount) {
            const recipeIngredient = recipe.ingredients.find(ing => ing.id === existingIng.id)!;
            recipeIngredient.amount = newAmount;
            await manager.save(RecipeIngredient, recipeIngredient);
          }
        } else {
          // Adiciona novo ingrediente
          const ingredient = await this.ingredientsService.findOne(ingredientId);
          if (!ingredient) {
            throw new BadRequestException(`Ingrediente ${ingredientId} não encontrado`);
          }
          
          const newRecipeIngredient = manager.create(RecipeIngredient, {
            recipe: savedRecipe,
            ingredient: ingredient,
            amount: newAmount
          });
          
          await manager.save(RecipeIngredient, newRecipeIngredient);
        }
      }

      // Recalcula o custo da receita
      const updatedRecipe = await manager.findOne(Recipe, {
        where: { id: savedRecipe.id },
        relations: ['ingredients', 'ingredients.ingredient'],
      });
      
      if (updatedRecipe) {
        updatedRecipe.cost = await this.calculateRecipeCost(updatedRecipe);
        await manager.save(Recipe, updatedRecipe);
      }

      return this.findOne(id, user.id);
    });
  }
}