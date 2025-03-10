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
  servings: number; 

  @Column({ default: 'pending' })
  status: 'pending' | 'in_progress' | 'completed' | 'canceled'; 

  @Column({ type: 'float', nullable: true })
  extraPrice: number | null;

  @Column({ type: 'text', nullable: true })
  observations: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @Column({ type: 'decimal' })
  unitPrice: number;
}