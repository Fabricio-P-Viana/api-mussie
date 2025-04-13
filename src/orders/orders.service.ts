import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { And, Between, In, IsNull, Not, Repository } from 'typeorm';
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

  async create(createOrderDto: CreateOrderDto, user: User): Promise<Order | null> {
    // Cria a ordem incluindo o total vindo do frontend
    const order = this.orderRepository.create({ 
      user, 
      deliveryDate: createOrderDto.deliveryDate ? new Date(createOrderDto.deliveryDate) : undefined,
      total: createOrderDto.total
    });
    
    const savedOrder = await this.orderRepository.save(order);
  
    // Processa os itens do pedido (sem recalcular o total)
    const orderRecipes = await Promise.all(
      createOrderDto.recipes.map(async (recipeInput) => {
        const recipe = await this.recipesService.findOne(recipeInput.recipeId, user.id);
        if (!recipe) throw new BadRequestException(`Receita ${recipeInput.recipeId} não encontrada`);
  
        return {
          order: savedOrder,
          recipe,
          servings: recipe.servings,
          extraPrice: recipeInput.extraPrice || 0,
          observations: recipeInput.observations || '',
          unitPrice: recipe.price,
          status: 'pending',
        } as OrderRecipe;
      }),
    );
  
    await this.orderRepository.manager.getRepository(OrderRecipe).save(orderRecipes);
    return this.findOne(savedOrder.id, user.id);
}

  async findOne(id: number, userId: number): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id, user: { id: userId } },
      relations: ['orderRecipes', 'orderRecipes.recipe','orderRecipes.recipe.ingredients'],
    });
    if (!order) throw new BadRequestException('Pedido não encontrado');
    return order;
  }
  
  async findAll(pagination: { skip: number; take: number }, userId: number): Promise<{ data: Order[]; total: number }> {
    const [data, total] = await this.orderRepository.findAndCount({
      where: {
        user: { id: userId },
        status: Not('completed'),
      },
      relations: ['orderRecipes', 'orderRecipes.recipe'],
      skip: pagination.skip,
      take: pagination.take,
    });
    return { data, total };
  }

  async findHistory(pagination: { skip: number; take: number }, userId: number): Promise<{ data: Order[]; total: number }> {
    const [data, total] = await this.orderRepository.findAndCount({
      where: {
        user: { id: userId },
        status: In(['completed', 'canceled']),
      },
      relations: ['orderRecipes', 'orderRecipes.recipe'],
      skip: pagination.skip,
      take: pagination.take,
      order: {
        updatedAt: 'DESC',
      },
    });
    return { data, total };
  }

  async update(id: number, updateOrderDto: UpdateOrderDto, userId: number): Promise<Order | null> {
    try {
      return await this.orderRepository.manager.transaction(async (manager) => {
        const order = await this.findOne(id, userId);
        if (!order) throw new BadRequestException('Pedido não encontrado');
        if (order.status === 'completed' || order.status === 'canceled') {
          throw new BadRequestException('Pedidos concluídos ou cancelados não podem ser atualizados');
        }

        if (updateOrderDto.status) {
          order.status = updateOrderDto.status;
          await manager.save(order);
        }

        let allRecipesCompleted = true;
        if (updateOrderDto.recipeUpdates?.length) {
          for (const update of updateOrderDto.recipeUpdates) {
            const orderRecipe = order.orderRecipes.find(or => or.recipe.id === update.recipeId);
            if (!orderRecipe) throw new BadRequestException(`Receita ${update.recipeId} não encontrada no pedido`);

            const previousStatus = orderRecipe.status;
            orderRecipe.status = update.status;

            if (update.status === 'completed' && previousStatus !== 'completed' && !orderRecipe.executedAt) {
              await this.recipesService.executeRecipe(orderRecipe.recipe.id, orderRecipe.servings, userId);
              orderRecipe.executedAt = new Date();
            }

            await manager.getRepository(OrderRecipe).save(orderRecipe);
            if (orderRecipe.status !== 'completed') allRecipesCompleted = false;
          }
        } else {
          allRecipesCompleted = order.orderRecipes.every(or => or.status === 'completed');
        }

        if (allRecipesCompleted && (!updateOrderDto.status || updateOrderDto.status === 'completed')) {
          order.status = 'completed';
          await manager.save(order);
        }

        return this.findOne(id, userId);
      });
    } catch (error) {
      console.error('Erro ao atualizar pedido:', error);
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Erro ao atualizar pedido');
    }
  }

  async findPendingOrders(userId: number, startDate?: Date, endDate?: Date): Promise<Order[]> {
    const currentDate = new Date();
    const defaultStartDate = startDate || new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const defaultEndDate = endDate || new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  
    return await this.orderRepository.find({
      where: {
        user: { id: userId },
        status: Not('completed'),
        deliveryDate: And(
          Not(IsNull()),
          Between(defaultStartDate, defaultEndDate)
        ),
        orderRecipes: {
          status: In(['pending', 'in_progress']),
        },
      },
      relations: ['orderRecipes', 'orderRecipes.recipe'],
      order: {
        deliveryDate: 'ASC',
      },
    });
  }

  async getProductionProgress(orderId: number, userId: number): Promise<any> {
    const order = await this.findOne(orderId, userId);
    
    return {
      steps: order.orderRecipes.map(or => ({
        orderRecipeId: or.id,
        completed: or.status === 'completed',
        ingredients: or.recipe.ingredients?.map(ing => ({
          id: ing.id,
          prepared: false
        })) || []
      }))
    };
  }
  
  async saveProductionProgress(orderId: number, progressData: any, userId: number): Promise<Order> {
    return this.orderRepository.manager.transaction(async (manager) => {
      const order = await this.findOne(orderId, userId);
      
      // Atualiza status das receitas
      for (const recipeUpdate of progressData.recipeUpdates) {
        const orderRecipe = order.orderRecipes.find(or => or.recipe.id === recipeUpdate.recipeId);
        if (!orderRecipe) continue;
        
        orderRecipe.status = recipeUpdate.status;
        await manager.getRepository(OrderRecipe).save(orderRecipe);
      }
  
      // Verifica se todas as receitas estão completas
      const allRecipesCompleted = order.orderRecipes.every(or => or.status === 'completed');
      if (allRecipesCompleted) {
        order.status = 'completed';
      } else if (progressData.status) {
        order.status = progressData.status;
      }
      
      await manager.save(order);
      return this.findOne(orderId, userId);
    });
  }
  
  async completeProduction(orderId: number, userId: number): Promise<Order> {
    const order = await this.findOne(orderId, userId);
    
    if (order.status === 'completed' || order.status === 'canceled') {
      throw new BadRequestException('Pedidos concluídos ou cancelados não podem ser atualizados');
    }
    
    // Marca todas as receitas como completas
    await this.orderRepository.manager.transaction(async (manager) => {
      for (const orderRecipe of order.orderRecipes) {
        if (orderRecipe.status !== 'completed') {
          orderRecipe.status = 'completed';
          await manager.getRepository(OrderRecipe).save(orderRecipe);
        }
      }
      
      order.status = 'completed';
      await manager.save(order);
    });
    
    return this.findOne(orderId, userId);
  }
}