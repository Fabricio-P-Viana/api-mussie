import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { RecipeIngredient } from './recipe-ingredient.entity';
import { User } from '../../users/entities/user.entity';
import { OrderRecipe } from 'src/orders/entities/order-recipe.entity';

@Entity()
export class Recipe {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'float', default: 0 })
  cost: number;

  @Column({ default: 1 })
  servings: number;

  @Column({ nullable: true })
  image: string;

  @Column({ type: 'int', nullable: true }) 
  preparationTime: number | null;

  @Column({ type: 'text', nullable: true }) 
  description: string | null;

  @Column({ type: 'float' }) 
  price: number;

  @OneToMany(() => RecipeIngredient, (recipeIngredient) => recipeIngredient.recipe, { cascade: true })
  ingredients: RecipeIngredient[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.recipes)
  user: User;

  @OneToMany(() => OrderRecipe, (orderRecipe) => orderRecipe.recipe)
  orderRecipes: OrderRecipe[];

  @Column({ default: false })
  showInPortifolio: boolean;

  @Column({ type: 'text' })
  preparationMode: string;
}