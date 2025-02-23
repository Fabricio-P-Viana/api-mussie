import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude()
  password: string;

  @Column({ type: 'varchar', nullable: true })
  resetToken: string | null;

  @Column({ type: 'timestamp', nullable: true })
  resetTokenExpiry: Date | null;

  @Column({ type: 'varchar', nullable: true })
  profileImage: string | null;

  @Column({ type: 'varchar' }) // Nome obrigatório
  name: string;

  @CreateDateColumn({ type: 'timestamp' }) // Criado automaticamente
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' }) // Atualizado automaticamente
  updatedAt: Date;

  @Column({ type: 'varchar', nullable: true }) // Nome da confeitaria opcional
  nameConfectionery: string | null;

  @Column({ type: 'varchar', nullable: true }) // Telefone opcional
  phone: string | null;
}