import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { RecipeIngredient } from './recipe-ingredient.entity';

@Entity()
export class Recipe {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ default: 1 })
  servings: number;

  @Column({ nullable: true })
  image: string; // Caminho da imagem no servidor

  @OneToMany(() => RecipeIngredient, (recipeIngredient) => recipeIngredient.recipe, { cascade: true })
  ingredients: RecipeIngredient[];
}