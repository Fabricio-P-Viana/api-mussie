import { IsString, IsNumber, Min, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class IngredientInput {
  @IsNumber({}, { message: 'O ID do ingrediente deve ser um número' })
  @Min(1, { message: 'O ID do ingrediente deve ser maior que 0' })
  @ApiProperty({ description: 'ID do ingrediente', example: 1 })
  ingredientId: number;

  @IsNumber({}, { message: 'A quantidade deve ser um número' })
  @Min(0, { message: 'A quantidade não pode ser negativa' })
  @ApiProperty({ description: 'Quantidade do ingrediente', example: 300 })
  amount: number;
}

export class CreateRecipeDto {
  @IsString({ message: 'O nome deve ser uma string' })
  @ApiProperty({ description: 'Nome da receita', example: 'Bolo de Chocolate' })
  name: string;

  @IsNumber({}, { message: 'As porções devem ser um número' })
  @Min(1, { message: 'As porções devem ser pelo menos 1' })
  @ApiProperty({ description: 'Número de porções', example: 1, required: false })
  servings?: number;

  @IsArray({ message: 'Os ingredientes devem ser uma lista' })
  @ValidateNested({ each: true })
  @Type(() => IngredientInput)
  @ApiProperty({ description: 'Lista de ingredientes', type: [IngredientInput] })
  ingredients: IngredientInput[];
}