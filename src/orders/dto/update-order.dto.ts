import { IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateOrderDto {
  @IsOptional()
  @IsEnum(['pending', 'completed', 'canceled'], { message: 'O status deve ser "pending", "completed" ou "canceled"' })
  @ApiProperty({ description: 'Status do pedido', enum: ['pending', 'completed', 'canceled'], required: false })
  status?: 'pending' | 'completed' | 'canceled';
}