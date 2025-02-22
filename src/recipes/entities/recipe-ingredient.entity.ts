import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Recipe } from './recipe.entity';
import { Ingredient } from '../../ingredients/entities/ingredient.entity';

@Entity()
export class RecipeIngredient {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Recipe, (recipe) => recipe.ingredients)
  recipe: Recipe;

  @ManyToOne(() => Ingredient)
  ingredient: Ingredient;

  @Column({ type: 'float' })
  amount: number;
}