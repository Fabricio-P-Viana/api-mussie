import { User } from 'src/users/entities/user.entity';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';

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

  @Column({ type: 'date' }) // Data de validade obrigatória
  expirationDate: Date;

  @Column({ type: 'varchar' }) // Unidade obrigatória
  unity: string;

  @Column({ type: 'varchar', nullable: true }) // Categoria permanece opcional
  category: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @Column({ type: 'float' })
  minimumStock: number;

  @ManyToOne(() => User, (user) => user.ingredient)
  user: User;
}