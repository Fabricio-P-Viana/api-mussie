import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { RecipesService } from '../recipes/recipes.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private recipesService: RecipesService,
  ) {}

  create(createOrderDto: CreateOrderDto): Promise<Order> {
    const order = this.orderRepository.create({
      recipe: { id: createOrderDto.recipeId } as any,
      servings: createOrderDto.servings,
    });
    return this.orderRepository.save(order);
  }

  findAll(pagination: { skip: number; take: number }): Promise<{ data: Order[]; total: number }> {
    return this.orderRepository
      .findAndCount({
        skip: pagination.skip,
        take: pagination.take,
        relations: ['recipe'],
      })
      .then(([data, total]) => ({ data, total }));
  }

  findOne(id: number): Promise<Order | null> { // Ajustado para permitir null
    return this.orderRepository.findOne({ where: { id }, relations: ['recipe'] });
  }

  async update(id: number, updateOrderDto: UpdateOrderDto): Promise<Order | null> { // Ajustado para permitir null
    const order = await this.findOne(id);
    if (!order) throw new Error('Pedido não encontrado');
    if (updateOrderDto.status === 'completed' && order.status !== 'completed') {
      await this.recipesService.executeRecipe(order.recipe.id, order.servings);
    }
    await this.orderRepository.update(id, updateOrderDto);
    return this.findOne(id);
  }
}