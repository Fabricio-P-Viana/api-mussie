import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { OrderRecipe } from './order-recipe.entity';

@Entity()
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToMany(() => OrderRecipe, (orderRecipe) => orderRecipe.order, { cascade: true })
  orderRecipes: OrderRecipe[]; 

  @Column({ default: 'pending' })
  status: 'pending' | 'completed' | 'canceled'; 

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.orders)
  user: User;

  @Column({ nullable: true }) 
  deliveryDate?: Date;

  @Column({ type: 'float', nullable: true })
  total?: number;
}