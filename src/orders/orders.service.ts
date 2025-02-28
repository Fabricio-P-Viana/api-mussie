import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { RecipesService } from '../recipes/recipes.service';
import { User } from '../users/entities/user.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private recipesService: RecipesService,
  ) {}

  async create(createOrderDto: CreateOrderDto, user: User): Promise<Order> {
    try {
      const recipe = await this.recipesService.findOne(createOrderDto.recipeId, user.id);
      if (!recipe) throw new BadRequestException('Receita não encontrada ou não pertence ao usuário');

      const order = this.orderRepository.create({
        recipe,
        servings: createOrderDto.servings,
        extraPrice: createOrderDto.extraPrice,
        observations: createOrderDto.observations,
        deliveryDate: createOrderDto.deliveryDate ? new Date(createOrderDto.deliveryDate) : null,
        user,
      } as any);
      const savedOrder = await this.orderRepository.save(order);
      return Array.isArray(savedOrder) ? savedOrder[0] : savedOrder;
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Erro ao criar pedido');
    }
  }

  async findAll(pagination: { skip: number; take: number }, userId: number): Promise<{ data: Order[]; total: number }> {
    try {
      const [data, total] = await this.orderRepository.findAndCount({
        where: { user: { id: userId } },
        skip: pagination.skip,
        take: pagination.take,
        relations: ['recipe'],
      });
      return { data, total };
    } catch (error) {
      console.error('Erro ao listar pedidos:', error);
      throw new InternalServerErrorException('Erro ao buscar pedidos');
    }
  }

  async findOne(id: number, userId: number): Promise<Order | null> {
    try {
      const order = await this.orderRepository.findOne({
        where: { id, user: { id: userId } },
        relations: ['recipe'],
      });
      if (!order) {
        throw new BadRequestException(`Pedido com ID ${id} não encontrado ou não pertence ao usuário`);
      }
      return order;
    } catch (error) {
      console.error('Erro ao buscar pedido:', error);
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Erro ao buscar pedido');
    }
  }

  async update(id: number, updateOrderDto: UpdateOrderDto, userId: number): Promise<Order | null> {
    try {
      const order = await this.findOne(id, userId);
      if (!order) throw new BadRequestException('Pedido não encontrado ou não pertence ao usuário');

      if (updateOrderDto.status === 'completed' && order.status !== 'completed') {
        await this.recipesService.executeRecipe(order.recipe.id, order.servings, userId);
      }

      const updateData = {
        ...updateOrderDto,
        deliveryDate: updateOrderDto.deliveryDate ? new Date(updateOrderDto.deliveryDate) : undefined,
      };
      await this.orderRepository.update(id, updateData);
      return await this.findOne(id, userId);
    } catch (error) {
      console.error('Erro ao atualizar pedido:', error);
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Erro ao atualizar pedido');
    }
  }
}