import { Injectable } from '@nestjs/common';
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

  create(createIngredientDto: CreateIngredientDto): Promise<Ingredient> {
    const ingredient = this.ingredientRepository.create(createIngredientDto);
    return this.ingredientRepository.save(ingredient);
  }

  findAll(pagination: { skip: number; take: number }): Promise<{ data: Ingredient[]; total: number }> {
    return this.ingredientRepository
      .findAndCount({ skip: pagination.skip, take: pagination.take })
      .then(([data, total]) => ({ data, total }));
  }

  findOne(id: number): Promise<Ingredient | null> { // Ajustado para permitir null
    return this.ingredientRepository.findOneBy({ id });
  }

  async update(id: number, updateIngredientDto: UpdateIngredientDto): Promise<Ingredient | null> { // Ajustado para permitir null
    await this.ingredientRepository.update(id, updateIngredientDto);
    return this.findOne(id);
  }

  async adjustVariableWasteFactor(id: number, realStock: number) {
    const ingredient = await this.findOne(id);
    if (!ingredient) throw new Error('Ingrediente não encontrado');
    const theoreticalStock = ingredient.stock;
    const difference = theoreticalStock - realStock;
    const totalBaseConsumption = 1000; // Exemplo fixo
    const adjustment = difference / totalBaseConsumption;
    const newVariableWasteFactor = ingredient.variableWasteFactor * 0.7 + adjustment * 0.3;
    return this.update(id, { variableWasteFactor: newVariableWasteFactor });
  }
}