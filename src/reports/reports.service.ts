import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { Order } from '../orders/entities/order.entity';
import { Ingredient } from 'src/ingredients/entities/ingredient.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(Ingredient)
    private ingredientRepository: Repository<Ingredient>,
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
  
  async getShoppingList(userId: number, startDate: string, endDate: string): Promise<{
    requiredIngredients: { name: string; amount: number; unit: string }[];
    currentStock: { name: string; stock: number; unit: string }[];
    shoppingList: { name: string; amountToBuy: number; unit: string }[];
  }> {
    // Filtrar apenas pedidos 'pending' e 'in_progress'
    const orders = await this.orderRepository.find({
      where: {
        user: { id: userId },
        createdAt: Between(new Date(startDate), new Date(endDate)),
        status: In(['pending', 'in_progress']), // Filtro adicionado
      },
      relations: [
        'orderRecipes',
        'orderRecipes.recipe',
        'orderRecipes.recipe.ingredients',
        'orderRecipes.recipe.ingredients.ingredient',
      ],
    });
  
    if (!Array.isArray(orders)) {
      console.error('Orders não é um array:', orders);
      return { requiredIngredients: [], currentStock: [], shoppingList: [] };
    }
  
    // Calcular ingredientes necessários
    const ingredientMap: { [key: number]: { name: string; amount: number; unit: string } } = {};
    orders.forEach((order) => {
      if (!order.orderRecipes || !Array.isArray(order.orderRecipes)) {
        console.warn(`Pedido ${order.id} sem orderRecipes válido:`, order);
        return;
      }
      order.orderRecipes.forEach((or) => {
        if (!or.recipe || !or.recipe.ingredients || !Array.isArray(or.recipe.ingredients)) {
          console.warn(`OrderRecipe sem ingredients válido:`, or);
          return;
        }
        const proportion = or.servings / or.recipe.servings;
        or.recipe.ingredients.forEach((ri) => {
          const ingredient = ri.ingredient;
          if (!ingredient || !ingredient.id) {
            console.warn('Ingrediente inválido:', ri);
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
  
    // Consultar estoque atual
    const ingredients = await this.ingredientRepository.find({ where: { user: { id: userId } } });
    const currentStock = ingredients.map((ing) => ({
      name: ing.name,
      stock: ing.stock || 0,
      unit: ing.unity,
    }));
  
    // Gerar lista de compras
    const shoppingList: { name: string; amountToBuy: number; unit: string }[] = [];
    requiredIngredients.forEach((req) => {
      const stockItem = currentStock.find((stock) => stock.name === req.name);
      const stockAmount = stockItem ? stockItem.stock : 0;
      const amountToBuy = Math.max(req.amount - stockAmount, 0); // Evita valores negativos
      if (amountToBuy > 0) {
        shoppingList.push({
          name: req.name,
          amountToBuy,
          unit: req.unit,
        });
      }
    });
  
    return { requiredIngredients, currentStock, shoppingList };
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
}