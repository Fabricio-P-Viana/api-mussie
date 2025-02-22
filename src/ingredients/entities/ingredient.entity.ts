import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Ingredient {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'float', default: 0 })
  stock: number;

  @Column({ type: 'float', default: 0.05 }) // 5% padrão
  fixedWasteFactor: number;

  @Column({ type: 'float', default: 0 }) // Começa em 0%
  variableWasteFactor: number;
}