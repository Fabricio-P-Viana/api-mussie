// src/orders/entities/order-recipe.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Order } from './order.entity';
import { Recipe } from '../../recipes/entities/recipe.entity';

@Entity()
export class OrderRecipe {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Order, (order) => order.orderRecipes)
  order: Order;

  @ManyToOne(() => Recipe, (recipe) => recipe.orderRecipes)
  recipe: Recipe;

  @Column({ type: 'int' })
  servings: number; // Quantidade de porções dessa receita no pedido

  @Column({ default: 'pending' })
  status: 'pending' | 'in_progress' | 'completed' | 'canceled'; // Status específico da receita no pedido

  @Column({ type: 'float', nullable: true })
  extraPrice: number | null; // Preço extra específico para essa receita (opcional)

  @Column({ type: 'text', nullable: true })
  observations: string | null; // Observações específicas para essa receita

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}