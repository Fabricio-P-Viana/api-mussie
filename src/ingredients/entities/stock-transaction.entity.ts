import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Ingredient } from './ingredient.entity';

export enum TransactionType {
  ENTRY = 'entry',
  EXIT = 'exit',
}

@Entity()
export class StockTransaction {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Ingredient, (ingredient) => ingredient.transactions)
  ingredient: Ingredient;

  @Column({ type: 'enum', enum: TransactionType })
  type: TransactionType;

  @Column({ type: 'float' })
  quantity: number;

  @CreateDateColumn({ type: 'timestamp' })
  timestamp: Date;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'date', nullable: true })
  expirationDate?: Date;
}