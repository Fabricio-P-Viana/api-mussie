import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
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

  @Column({ type: 'varchar', nullable: true }) // Explicitamente VARCHAR para string|null
  resetToken: string | null;

  @Column({ type: 'timestamp', nullable: true }) // Explicitamente TIMESTAMP para Date|null
  resetTokenExpiry: Date | null;

  @Column({ type: 'varchar', nullable: true }) // Explicitamente VARCHAR para string|null
  profileImage: string | null;
}