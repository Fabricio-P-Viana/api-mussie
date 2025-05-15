import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { Order } from '../orders/entities/order.entity';
import { Ingredient } from 'src/ingredients/entities/ingredient.entity';
import { Cron } from '@nestjs/schedule';
import { User } from 'src/users/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Ingredient)
    private readonly ingredientRepository: Repository<Ingredient>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
    @InjectQueue('mailQueue') private readonly mailQueue: Queue,
  ) {}

  async getOrderHistory(userId: number, startDate: string, endDate: string): Promise<Order[]> {
    return this.orderRepository.find({
      where: {
        user: { id: userId },
        createdAt: Between(new Date(startDate), new Date(endDate)),
      },
      relations: [
        'orderRecipes',
        'orderRecipes.recipe',
        'orderRecipes.recipe.ingredients',
        'orderRecipes.recipe.ingredients.ingredient',
      ],
    });
  }

  async getPopularRecipes(userId: number, startDate: string, endDate: string): Promise<any[]> {
    const orders = await this.getOrderHistory(userId, startDate, endDate);
    const recipeCount: { [key: number]: { name: string; count: number } } = {};
    orders.forEach((order) => {
      order.orderRecipes.forEach((or) => {
        recipeCount[or.recipe.id] = recipeCount[or.recipe.id] || { name: or.recipe.name, count: 0 };
        recipeCount[or.recipe.id].count += or.servings;
      });
    });
    return Object.values(recipeCount).sort((a, b) => b.count - a.count);
  }
  
  async getShoppingList(
    userId: number,
    startDate: string,
    endDate: string,
    includeMinimumStock: boolean = true
  ): Promise<{
    requiredIngredients: { name: string; amount: number; unit: string }[];
    currentStock: { name: string; stock: number; unit: string; minimumStock?: number }[];
    shoppingList: { name: string; amountToBuy: number; unit: string }[];
  }> {
    this.logger.log(`Iniciando geração de lista de compras para usuário ${userId} entre ${startDate} e ${endDate}`);

    // Ajusta startDate para início do dia e endDate para 23:59
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
  
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    this.logger.log(`Buscando pedidos entre ${start.toISOString()} e ${end.toISOString()}`);
    const orders = await this.orderRepository.find({
      where: {
        user: { id: userId },
        createdAt: Between(new Date(start), new Date(end)),
        status: In(['pending', 'in_progress']),
      },
      relations: [
        'orderRecipes',
        'orderRecipes.recipe',
        'orderRecipes.recipe.ingredients',
        'orderRecipes.recipe.ingredients.ingredient',
      ],
      select: {
        id: true,
        status: true,
        orderRecipes: {
          id: true,
          servings: true,
          recipe: {
            id: true,
            servings: true,
            ingredients: {
              amount: true,
              ingredient: {
                id: true,
                name: true,
                unity: true
              }
            }
          }
        }
      }
    });
  
    if (!Array.isArray(orders)) {
      this.logger.error('Orders não é um array:', orders);
      return { requiredIngredients: [], currentStock: [], shoppingList: [] };
    }

    this.logger.log(`Encontrados ${orders.length} pedidos para processar`);
  
    // Calcular ingredientes necessários
    const ingredientMap: { [key: number]: { name: string; amount: number; unit: string } } = {};
    orders.forEach((order) => {
      if (!order.orderRecipes || !Array.isArray(order.orderRecipes)) {
        this.logger.warn(`Pedido ${order.id} sem orderRecipes válido:`, order);
        return;
      }
      order.orderRecipes.forEach((or) => {
        if (!or.recipe || !or.recipe.ingredients || !Array.isArray(or.recipe.ingredients)) {
          this.logger.warn(`OrderRecipe ${or.id} sem ingredients válido:`, or);
          return;
        }
        const proportion = or.servings / or.recipe.servings;
        or.recipe.ingredients.forEach((ri) => {
          const ingredient = ri.ingredient;
          if (!ingredient || !ingredient.id) {
            this.logger.warn('Ingrediente inválido encontrado:', ri);
            return;
          }
          const totalAmount = ri.amount * proportion;
          if (ingredientMap[ingredient.id]) {
            ingredientMap[ingredient.id].amount += totalAmount;
          } else {
            ingredientMap[ingredient.id] = {
              name: ingredient.name,
              amount: totalAmount,
              unit: ingredient.unity,
            };
          }
        });
      });
    });
    const requiredIngredients = Object.values(ingredientMap);
    this.logger.log(`Calculados ${requiredIngredients.length} ingredientes necessários para produção`);
  
    // Consultar estoque atual incluindo minimumStock
    const ingredients = await this.ingredientRepository.find({ 
      where: { user: { id: userId } },
      select: ['id', 'name', 'stock', 'unity', 'minimumStock']
    });
  
    const currentStock = ingredients.map((ing) => ({
      name: ing.name,
      stock: ing.stock || 0,
      unit: ing.unity,
      minimumStock: ing.minimumStock || 0
    }));
    this.logger.log(`Consultado estoque atual com ${currentStock.length} itens`);
  
    const shoppingList: { name: string; amountToBuy: number; unit: string }[] = [];
  
    // 1. Processa ingredientes dos pedidos
    requiredIngredients.forEach((req) => {
      const stockItem = currentStock.find((stock) => stock.name === req.name);
      const stockAmount = stockItem?.stock || 0;
      const minimumStock = stockItem?.minimumStock || 0;
      
      const neededForProduction = req.amount - stockAmount;
      const neededForMinimumStock = minimumStock - stockAmount;
      
      let amountToBuy = Math.max(
        neededForProduction,
        includeMinimumStock ? neededForMinimumStock : 0,
        0
      );
  
      if (amountToBuy > 0) {
        const productionLog = neededForProduction > 0 
          ? `Necessário ${neededForProduction.toFixed(2)} para produção (pedidos totalizam ${req.amount.toFixed(2)} e estoque tem ${stockAmount.toFixed(2)})`
          : `Estoque suficiente para produção (${stockAmount.toFixed(2)} disponível para ${req.amount.toFixed(2)} necessário)`;
        
        const minimumStockLog = neededForMinimumStock > 0 && includeMinimumStock
          ? ` + ${neededForMinimumStock.toFixed(2)} para atingir estoque mínimo de ${minimumStock}`
          : '';
        
        this.logger.log(`Ingrediente ${req.name}: ${productionLog}${minimumStockLog} → Total a comprar: ${amountToBuy.toFixed(2)}`);
        
        shoppingList.push({
          name: req.name,
          amountToBuy,
          unit: req.unit,
        });
      } else {
        this.logger.log(`Ingrediente ${req.name}: Estoque suficiente (${stockAmount.toFixed(2)}) para produção (${req.amount.toFixed(2)}) e estoque mínimo (${minimumStock})`);
      }
    });
  
    // 2. Adiciona TODOS os ingredientes com estoque abaixo do mínimo quando includeMinimumStock é true
    if (includeMinimumStock) {
      currentStock.forEach((stockItem) => {
        // Verifica se o estoque está abaixo do mínimo (considerando minimumStock > 0)
        const belowMinimum = stockItem.minimumStock > 0 && stockItem.stock < stockItem.minimumStock;
        
        if (belowMinimum) {
          const amountToBuy = stockItem.minimumStock - stockItem.stock;
          
          // Verifica se o ingrediente já está na lista de compras
          const existingItem = shoppingList.find(item => item.name === stockItem.name);
          
          if (!existingItem) {
            this.logger.log(`Ingrediente ${stockItem.name}: Não necessário para produção mas estoque (${stockItem.stock.toFixed(2)}) abaixo do mínimo (${stockItem.minimumStock}) → Comprar ${amountToBuy.toFixed(2)}`);
            shoppingList.push({
              name: stockItem.name,
              amountToBuy,
              unit: stockItem.unit,
            });
          } else {
            // Se já está na lista, apenas logamos que o estoque mínimo já foi considerado
            this.logger.log(`Ingrediente ${stockItem.name}: Já incluído na lista (${existingItem.amountToBuy.toFixed(2)}) que considera tanto produção quanto estoque mínimo`);
          }
        }
      });
    }

    this.logger.log(`Lista de compras gerada com ${shoppingList.length} itens`);
  
    return {
      requiredIngredients,
      currentStock,
      shoppingList
    };
  }
  
  async getRevenueByPeriod(userId: number, startDate: string, endDate: string): Promise<number> {
    const orders = await this.getOrderHistory(userId, startDate, endDate);
    return orders.reduce((sum, order) => {
      const orderRevenue = order.orderRecipes.reduce((acc, or) => {
        const proportion = or.servings / or.recipe.servings;
        const baseRevenue = or.unitPrice * proportion;
        return acc + baseRevenue + (or.extraPrice || 0);
      }, 0);
      return sum + (order.status === 'completed' ? orderRevenue : 0);
    }, 0);
  }

  private getWeekDateRange(): { firstDay: string; lastDay: string } {
    const now = new Date();
    const firstDay = new Date(now.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1)));
    const lastDay = new Date(firstDay);
    lastDay.setDate(lastDay.getDate() + 6);

    return {
      firstDay: firstDay.toISOString().split('T')[0],
      lastDay: lastDay.toISOString().split('T')[0],
    };
  }

  @Cron('0 17 * * 5') // Toda sexta às 17:00 (5 = sexta-feira)
  // @Cron(CronExpression.EVERY_10_SECONDS)
  async sendWeeklySalesReports() {
    this.logger.log('Starting weekly sales reports distribution...');
    const { firstDay, lastDay } = this.getWeekDateRange();
    const reportUrl = `http://localhost:3000/reports?firstDay=${firstDay}&lastDay=${lastDay}`;

    const users = await this.userRepository.find({ 
      where: { receiveReports: true },
      select: ['id', 'email'],
    });

    for (const user of users) {
      await this.mailQueue.add('sendSalesReport', {
        email: user.email,
        reportUrl,
        userId: user.id,
      }, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      });
    }
  }

  @Cron('0 3 * * 1') // Toda segunda-feira às 03:00
  async sendWeeklyShoppingReports() {
    this.logger.log('Starting weekly shopping reports distribution...');
    const { firstDay, lastDay } = this.getWeekDateRange();
    const reportUrl = `http://localhost:3000/shopping-list?firstDay=${firstDay}&lastDay=${lastDay}`;

    const users = await this.userRepository.find({ 
      where: { receiveReports: true },
      select: ['id', 'email'],
    });

    for (const user of users) {
      await this.mailQueue.add('sendShoppingReport', {
        email: user.email,
        reportUrl,
        userId: user.id,
      }, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      });
    }
  }
}