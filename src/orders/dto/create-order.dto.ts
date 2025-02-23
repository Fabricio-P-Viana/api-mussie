import { IsNumber, Min, IsOptional, IsString, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderDto {
  @IsNumber({}, { message: 'O ID da receita deve ser um número' })
  @Min(1, { message: 'O ID da receita deve ser maior que 0' })
  @ApiProperty({ description: 'ID da receita associada', example: 1 })
  recipeId: number;

  @IsNumber({}, { message: 'As porções devem ser um número' })
  @Min(1, { message: 'As porções devem ser pelo menos 1' })
  @ApiProperty({ description: 'Número de porções', example: 2 })
  servings: number;

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