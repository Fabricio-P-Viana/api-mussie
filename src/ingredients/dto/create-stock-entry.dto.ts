import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateStockEntryDto {
  @ApiProperty({ description: 'ID do ingrediente', example: 1 })
  @IsInt()
  ingredientId: number;

  @ApiProperty({ description: 'Quantidade comprada', example: 500 })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty({ description: 'Preço total da compra (opcional)', example: 25.0, required: false })
  @IsNumber()
  @IsOptional()
  totalPrice?: number;

  @ApiProperty({ description: 'Descrição da transação (opcional)', example: 'Compra no mercado', required: false })
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Data de validade (opcional)', example: '2025-12-31', required: false })
  @IsDateString()
  @IsOptional()
  expirationDate?: string;
}