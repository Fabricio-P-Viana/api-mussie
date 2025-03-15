import { User } from 'src/users/entities/user.entity';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { StockTransaction } from './stock-transaction.entity';

@Entity()
export class Ingredient {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'float', default: 0 })
  stock: number;

  @Column({ type: 'float', default: 0.05 })
  fixedWasteFactor: number;

  @Column({ type: 'float', default: 0 })
  variableWasteFactor: number;

  @Column({ type: 'date' })
  expirationDate: Date;

  @Column({ type: 'varchar' })
  unity: string;

  @Column({ type: 'varchar', nullable: true })
  category: string | null;

  @Column({ type: 'float', default: 0 })
  minimumStock: number;

  @Column({ type: 'float', default: 0 }) // Novo campo para preço
  price: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.ingredient)
  user: User;

  @OneToMany(() => StockTransaction, (transaction) => transaction.ingredient)
  transactions: StockTransaction[];
}