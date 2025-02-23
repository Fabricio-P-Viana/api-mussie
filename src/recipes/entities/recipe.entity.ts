import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { RecipeIngredient } from './recipe-ingredient.entity';
import { User } from '../../auth/entities/user.entity';

@Entity()
export class Recipe {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ default: 1 })
  servings: number;

  @Column({ nullable: true })
  image: string;

  @Column({ type: 'int', nullable: true }) // Tempo de preparo em minutos
  preparationTime: number | null;

  @Column({ type: 'text', nullable: true }) // Descrição da receita
  description: string | null;

  @Column({ type: 'float' }) // Preço da receita (obrigatório)
  price: number;

  @OneToMany(() => RecipeIngredient, (recipeIngredient) => recipeIngredient.recipe, { cascade: true })
  ingredients: RecipeIngredient[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.recipes)
  user: User;
}