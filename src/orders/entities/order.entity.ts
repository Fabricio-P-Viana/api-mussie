import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Recipe } from '../../recipes/entities/recipe.entity';

@Entity()
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Recipe)
  recipe: Recipe;

  @Column()
  servings: number;

  @Column({ default: 'pending' })
  status: 'pending' | 'completed' | 'canceled';

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}