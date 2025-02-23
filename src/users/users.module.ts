import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { AuthModule } from '../auth/auth.module'; // Importa AuthModule

@Module({
  imports: [AuthModule], // Importa todas as dependências do AuthService
  controllers: [UsersController],
})
export class UsersModule {}