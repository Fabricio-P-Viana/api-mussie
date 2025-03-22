// src/recipes/dto/create-recipe.dto.ts
import { IsString, IsNumber, Min, IsArray, ValidateNested, IsOptional, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';
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
  @Transform(({ value }) => Number(value))
  @ApiProperty({ description: 'Número de porções', example: 1 })
  servings: number;

  @IsOptional()
  @IsNumber({}, { message: 'O tempo de preparo deve ser um número' })
  @Min(1, { message: 'O tempo de preparo deve ser pelo menos 1 minuto' })
  @Transform(({ value }) => (value ? Number(value) : undefined))
  @ApiProperty({ description: 'Tempo de preparo em minutos', example: 60, required: false })
  preparationTime?: number;

  @IsOptional()
  @IsString({ message: 'A descrição deve ser uma string' })
  @ApiProperty({ description: 'Descrição da receita', example: 'Um bolo delicioso de chocolate', required: false })
  description?: string;

  @IsNumber({}, { message: 'O preço deve ser um número' })
  @Min(0, { message: 'O preço não pode ser negativo' })
  @Transform(({ value }) => Number(value))
  @ApiProperty({ description: 'Preço da receita', example: 25.99 })
  price: number;

  @IsArray({ message: 'Os ingredientes devem ser uma lista' })
  @ValidateNested({ each: true })
  @Type(() => IngredientInput)
  @ApiProperty({ description: 'Lista de ingredientes', type: [IngredientInput] })
  ingredients: IngredientInput[];

  @IsOptional() 
  @IsBoolean()
  showInPortifolio?: boolean;

  @IsOptional() 
  @IsString()
  preparationMode?: string;
}