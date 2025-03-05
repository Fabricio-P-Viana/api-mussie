import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { RecipesService } from '../recipes/recipes.service';
import { User } from '../users/entities/user.entity';
import { OrderRecipe } from './entities/order-recipe.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private recipesService: RecipesService,
  ) {}

  async create(createOrderDto: CreateOrderDto, user: User): Promise<Order|null> {
    try {
      const order = this.orderRepository.create({ user });
      const savedOrder = await this.orderRepository.save(order);
  
      const orderRecipes = await Promise.all(
        createOrderDto.recipes.map(async (recipeInput) => {
          const recipe = await this.recipesService.findOne(recipeInput.recipeId, user.id);
          if (!recipe) throw new BadRequestException(`Receita ${recipeInput.recipeId} não encontrada`);
          
          return {
            order: savedOrder,
            recipe,
            servings: recipeInput.servings,
            extraPrice: recipeInput.extraPrice,
            observations: recipeInput.observations,
            status: 'pending',
          } as OrderRecipe;
        }),
      );
  
      await this.orderRepository.manager.getRepository(OrderRecipe).save(orderRecipes);
      return this.findOne(savedOrder.id, user.id);
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Erro ao criar pedido');
    }
  }

  async findOne(id: number, userId: number): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id, user: { id: userId } },
      relations: ['orderRecipes', 'orderRecipes.recipe'],
    });
    if (!order) throw new BadRequestException('Pedido não encontrado');
    return order;
  }
  
  async findAll(pagination: { skip: number; take: number }, userId: number): Promise<{ data: Order[]; total: number }> {
    const [data, total] = await this.orderRepository.findAndCount({
      where: { user: { id: userId } },
      relations: ['orderRecipes', 'orderRecipes.recipe'],
      skip: pagination.skip,
      take: pagination.take,
    });
    return { data, total };
  }

  async update(id: number, updateOrderDto: UpdateOrderDto, userId: number): Promise<Order|null> {
    try {
      const order = await this.findOne(id, userId);
      if (!order) throw new BadRequestException('Pedido não encontrado');
  
      if (updateOrderDto.status) {
        order.status = updateOrderDto.status;
        await this.orderRepository.save(order);
      }
  
      if (updateOrderDto.recipeUpdates?.length) {
        for (const update of updateOrderDto.recipeUpdates) {
          const orderRecipe = order.orderRecipes.find(or => or.recipe.id === update.recipeId);
          if (!orderRecipe) throw new BadRequestException(`Receita ${update.recipeId} não encontrada no pedido`);
          
          orderRecipe.status = update.status;
          if (update.status === 'completed' && orderRecipe.status !== 'completed') {
            await this.recipesService.executeRecipe(orderRecipe.recipe.id, orderRecipe.servings, userId);
          }
          await this.orderRepository.manager.getRepository(OrderRecipe).save(orderRecipe);
        }
      }
  
      return this.findOne(id, userId);
    } catch (error) {
      console.error('Erro ao atualizar pedido:', error);
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Erro ao atualizar pedido');
    }
  }
}