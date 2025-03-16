import { IsInt, IsString, IsEnum, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateNotificationDto {
  @IsInt({ message: 'O ID do usuário deve ser um número inteiro' })
  @Min(1, { message: 'O ID do usuário deve ser positivo' })
  @ApiProperty({ description: 'ID do usuário', example: 1 })
  userId: number;

  @IsInt({ message: 'O ID do ingrediente deve ser um número inteiro' })
  @Min(1, { message: 'O ID do ingrediente deve ser positivo' })
  @ApiProperty({ description: 'ID do ingrediente', example: 1 })
  ingredientId: number;

  @IsEnum(['low_stock', 'near_expiration'], { message: 'O tipo deve ser "low_stock" ou "near_expiration"' })
  @ApiProperty({ description: 'Tipo de notificação', example: 'low_stock', enum: ['low_stock', 'near_expiration'] })
  type: 'low_stock' | 'near_expiration';

  @IsString({ message: 'A mensagem deve ser uma string' })
  @ApiProperty({ description: 'Mensagem da notificação', example: 'Estoque baixo de Farinha' })
  message: string;
}
