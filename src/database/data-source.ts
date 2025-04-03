import { DataSource as TypeOrmDataSource } from 'typeorm';

export const DataSource = new TypeOrmDataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'root',
  database: 'confeitaria',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: true,
});