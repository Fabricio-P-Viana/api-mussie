import { IsEnum, IsOptional, IsNumber, Min, IsString, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateOrderDto {
  @IsOptional()
  @IsEnum(['pending', 'completed', 'canceled'], { message: 'O status deve ser "pending", "completed" ou "canceled"' })
  @ApiProperty({ description: 'Status do pedido', enum: ['pending', 'completed', 'canceled'], required: false })
  status?: 'pending' | 'completed' | 'canceled';

  @IsOptional()
  @IsNumber({}, { message: 'O preço extra deve ser um número' })
  @Min(0, { message: 'O preço extra não pode ser negativo' })
  @ApiProperty({ description: 'Preço extra do pedido', example: 5.99, required: false })
  extraPrice?: number;

  @IsOptional()
  @IsString({ message: 'As observações devem ser uma string' })
  @ApiProperty({ description: 'Observações do pedido', example: 'Entregar no portão', required: false })
  observations?: string;

  @IsOptional()
  @IsDateString({}, { message: 'A data de entrega deve ser uma data válida' })
  @ApiProperty({ description: 'Data de entrega do pedido', example: '2025-03-01', required: false })
  deliveryDate?: string;
}