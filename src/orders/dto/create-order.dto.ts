import { IsNumber, Min, IsOptional, IsString, IsDateString, IsArray, ValidateNested, IsDate } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class RecipeOrderInput {
  @IsNumber({}, { message: 'O ID da receita deve ser um número' })
  @Min(1, { message: 'O ID da receita deve ser maior que 0' })
  @ApiProperty({ description: 'ID da receita', example: 1 })
  recipeId: number;

  @IsNumber({}, { message: 'As porções devem ser um número' })
  @Min(1, { message: 'As porções devem ser pelo menos 1' })
  @ApiProperty({ description: 'Número de porções', example: 2 })
  servings: number;

  @IsOptional()
  @IsNumber({}, { message: 'O preço extra deve ser um número' })
  @Min(0, { message: 'O preço extra não pode ser negativo' })
  @ApiProperty({ description: 'Preço extra', example: 5.99, required: false })
  extraPrice?: number;

  @IsOptional()
  @IsString({ message: 'As observações devem ser uma string' })
  @ApiProperty({ description: 'Observações', example: 'Sem açúcar', required: false })
  observations?: string;
}

export class CreateOrderDto {
  @IsArray({ message: 'As receitas devem ser uma lista' })
  @ValidateNested({ each: true })
  @Type(() => RecipeOrderInput)
  @ApiProperty({ description: 'Lista de receitas no pedido', type: [RecipeOrderInput] })
  recipes: RecipeOrderInput[];

  @IsOptional()
  @Type(() => Date)
  @ApiProperty({ description: 'Data de entrega', example: '2025-03-15T10:00', required: false })
  deliveryDate?: Date;

  @IsOptional()
  @IsNumber({}, { message: 'O total deve ser um número' })
  @Min(0, { message: 'O total não pode ser negativo' })
  @ApiProperty({ description: 'Total', example: 25.99, required: false })
  total?: number;
}