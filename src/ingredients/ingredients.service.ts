import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Raw, Repository } from 'typeorm';
import { Ingredient } from './entities/ingredient.entity';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';
import { StockTransaction, TransactionType } from './entities/stock-transaction.entity';
import { CreateStockEntryDto } from './dto/create-stock-entry.dto';

@Injectable()
export class IngredientsService {
  constructor(
    @InjectRepository(Ingredient)
    private ingredientRepository: Repository<Ingredient>,
    @InjectRepository(StockTransaction)
    private stockTransactionRepository: Repository<StockTransaction>,
  ) {}

  async create(createIngredientDto: CreateIngredientDto, userId: number): Promise<Ingredient> {
    const ingredient = this.ingredientRepository.create({
      ...createIngredientDto,
      user: { id: userId },
      expirationDate: new Date(createIngredientDto.expirationDate),
      price: createIngredientDto.price || 0,
    });
    const savedIngredient = await this.ingredientRepository.save(ingredient);

    await this.recordStockTransaction(savedIngredient.id, TransactionType.ENTRY, createIngredientDto.stock, 'Ingrediente criado', createIngredientDto.expirationDate);
    return savedIngredient;
  }

  async findAll(pagination: { skip: number; take: number }, userId: number): Promise<{ data: Ingredient[]; total: number }> {
    try {
      const [data, total] = await this.ingredientRepository.findAndCount({
        where: { user: { id: userId } },
        skip: pagination.skip,
        take: pagination.take,
        relations: ['user'],
      });
      return { data, total };
    } catch (error) {
      console.error('Erro ao listar ingredientes:', error);
      throw new InternalServerErrorException('Erro ao buscar ingredientes');
    }
  }

  async getStockHistory(pagination: { skip: number; take: number }, userId: number): Promise<{ data: StockTransaction[]; total: number }> {
    try {
      const [data, total] = await this.stockTransactionRepository.findAndCount({
        where: { ingredient: { user: { id: userId } } },
        relations: ['ingredient'],
        order: { timestamp: 'DESC' },
        skip: pagination.skip,
        take: pagination.take,
      });
      return { data, total };
    } catch (error) {
      console.error('Erro ao listar histórico:', error);
      throw new InternalServerErrorException('Erro ao buscar histórico de entradas e saídas de ingredientes');
    }
  }

  async findOne(id: number): Promise<Ingredient | null> {
    try {
      const ingredient = await this.ingredientRepository.findOneBy({ id });
      if (!ingredient) {
        throw new BadRequestException(`Ingrediente com ID ${id} não encontrado`);
      }
      return ingredient;
    } catch (error) {
      console.error('Erro ao buscar ingrediente:', error);
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Erro ao buscar ingrediente');
    }
  }

  async update(id: number, updateIngredientDto: UpdateIngredientDto): Promise<Ingredient | null> {
    const ingredient = await this.findOne(id);
    if (!ingredient) throw new BadRequestException(`Ingrediente com ID ${id} não encontrado`);

    const stockChange = updateIngredientDto.stock !== undefined ? updateIngredientDto.stock - ingredient.stock : 0;
    const updateData = {
      ...updateIngredientDto,
      expirationDate: updateIngredientDto.expirationDate ? new Date(updateIngredientDto.expirationDate) : undefined,
    };
    await this.ingredientRepository.update(id, updateData);

    if (stockChange !== 0) {
      const type = stockChange > 0 ? TransactionType.ENTRY : TransactionType.EXIT;
      await this.recordStockTransaction(id, type, Math.abs(stockChange), 'Ajuste manual de estoque', updateIngredientDto.expirationDate);
    }

    return this.findOne(id);
  }

  async recordStockTransaction(ingredientId: number, type: TransactionType, quantity: number, description?: string, expirationDate?: string) {
    const transaction = this.stockTransactionRepository.create({
      ingredient: { id: ingredientId },
      type,
      quantity,
      description,
      expirationDate: expirationDate ? new Date(expirationDate) : undefined, 
    });
    await this.stockTransactionRepository.save(transaction);
  }

  async adjustVariableWasteFactor(id: number, realStock: number): Promise<Ingredient | null> {
    try {
      const ingredient = await this.findOne(id);
      if (!ingredient) throw new BadRequestException(`Ingrediente com ID ${id} não encontrado`);
      const theoreticalStock = ingredient.stock;
      const difference = theoreticalStock - realStock;
      const totalBaseConsumption = 1000; // Exemplo fixo
      const adjustment = difference / totalBaseConsumption;
      const newVariableWasteFactor = ingredient.variableWasteFactor * 0.7 + adjustment * 0.3;
      return await this.update(id, { variableWasteFactor: newVariableWasteFactor });
    } catch (error) {
      console.error('Erro ao ajustar fator de perda variável:', error);
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Erro ao ajustar fator de perda variável');
    }
  }

  async addStockEntry(createStockEntryDto: CreateStockEntryDto): Promise<Ingredient | null> {
    const { ingredientId, quantity, totalPrice, description, expirationDate } = createStockEntryDto;

    const ingredient = await this.findOne(ingredientId);
    if (!ingredient) throw new BadRequestException(`Ingrediente com ID ${ingredientId} não encontrado`);

    // Atualizar o estoque
    ingredient.stock += quantity;

    // Atualizar o preço, se fornecido
    if (totalPrice !== undefined) {
      ingredient.price = totalPrice / (quantity / 1000); // Assume unidade base como kg ou L
    }

    // Atualizar a data de validade do ingrediente, se fornecida
    if (expirationDate) {
      ingredient.expirationDate = new Date(expirationDate);
    }

    // Salvar as alterações no ingrediente
    await this.ingredientRepository.save(ingredient);

    // Registrar a transação de entrada com a data de validade
    await this.recordStockTransaction(ingredientId, TransactionType.ENTRY, quantity, description || 'Compra registrada', expirationDate);

    return this.findOne(ingredientId);
  }

  async getLowStockIngredients(userId: number): Promise<Ingredient[]> {
    return this.ingredientRepository.find({
      where: {
        user: { id: userId },
        stock: LessThan(Raw((alias) => `${alias}.minimumStock`)),
      },
    });
  }
}