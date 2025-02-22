import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
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
}