import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ingredient } from './entities/ingredient.entity';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';

@Injectable()
export class IngredientsService {
  constructor(
    @InjectRepository(Ingredient)
    private ingredientRepository: Repository<Ingredient>,
  ) {}

  async create(createIngredientDto: CreateIngredientDto): Promise<Ingredient> {
    try {
      console.log('Criando ingrediente com DTO:', createIngredientDto);
      const ingredient = this.ingredientRepository.create({
        ...createIngredientDto,
        expirationDate: new Date(createIngredientDto.expirationDate),
      });
      const savedIngredient = await this.ingredientRepository.save(ingredient);
      console.log('Ingrediente salvo:', savedIngredient);
      return savedIngredient;
    } catch (error) {
      console.error('Erro ao criar ingrediente:', error);
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Erro ao salvar ingrediente no banco');
    }
  }

  async findAll(pagination: { skip: number; take: number }, userId: number): Promise<{ data: Ingredient[]; total: number }> {
    try {
      const [data, total] = await this.ingredientRepository.findAndCount({
        where: { user: { id: userId } }, // Filtra pelo userId
        skip: pagination.skip,
        take: pagination.take,
        relations: ['user'], // Inclui o relacionamento com User, se necessário
      });
      return { data, total };
    } catch (error) {
      console.error('Erro ao listar ingredientes:', error);
      throw new InternalServerErrorException('Erro ao buscar ingredientes');
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
    try {
      const updateData = {
        ...updateIngredientDto,
        expirationDate: updateIngredientDto.expirationDate ? new Date(updateIngredientDto.expirationDate) : undefined,
      };
      await this.ingredientRepository.update(id, updateData);
      const updatedIngredient = await this.findOne(id);
      if (!updatedIngredient) {
        throw new BadRequestException(`Ingrediente com ID ${id} não encontrado após atualização`);
      }
      return updatedIngredient;
    } catch (error) {
      console.error('Erro ao atualizar ingrediente:', error);
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Erro ao atualizar ingrediente');
    }
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
}