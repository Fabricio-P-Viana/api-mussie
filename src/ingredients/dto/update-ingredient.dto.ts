import { IsNumber, Min, IsOptional, IsDateString, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateIngredientDto {
  @IsOptional()
  @IsString({ message: 'O nome deve ser uma string' })
  @ApiProperty({ description: 'Nome do ingrediente', example: 'Farinha', required: false })
  name?: string;

  @IsOptional()
  @IsNumber({}, { message: 'O estoque deve ser um número' })
  @Min(0, { message: 'O estoque não pode ser negativo' })
  @ApiProperty({ description: 'Quantidade em estoque', example: 1500, required: false })
  stock?: number;

  @IsOptional()
  @IsNumber({}, { message: 'O fator de perda fixa deve ser um número' })
  @Min(0, { message: 'O fator de perda fixa não pode ser negativo' })
  @ApiProperty({ description: 'Fator de perda fixa (percentual)', example: 0.05, required: false })
  fixedWasteFactor?: number;

  @IsOptional()
  @IsNumber({}, { message: 'O fator de perda variável deve ser um número' })
  @Min(0, { message: 'O fator de perda variável não pode ser negativo' })
  @ApiProperty({ description: 'Fator de perda variável (percentual)', example: 0.02, required: false })
  variableWasteFactor?: number;

  @IsOptional()
  @IsDateString({}, { message: 'A data de validade deve ser uma data válida' })
  @ApiProperty({ description: 'Data de validade do ingrediente', example: '2025-12-31', required: false })
  expirationDate?: string;

  @IsOptional()
  @IsString({ message: 'A unidade deve ser uma string' })
  @ApiProperty({ description: 'Unidade de medida', example: 'g', required: false })
  unity?: string;

  @IsOptional()
  @IsString({ message: 'A categoria deve ser uma string' })
  @ApiProperty({ description: 'Categoria do ingrediente', example: 'Doces', required: false })
  category?: string;

  @IsOptional()
  @IsNumber({}, { message: 'O estoque mínimo deve ser um número' })
  @Min(0, { message: 'O estoque mínimo não pode ser negativo' })
  @ApiProperty({ description: 'Estoque mínimo', example: 100, required: false })
  minimumStock?: number;

  @IsOptional()
  @IsNumber({}, { message: 'O preço deve ser um número' })
  @Min(0, { message: 'O preço não pode ser negativo' })
  @ApiProperty({ description: 'Preço do ingrediente (em reais)', example: 10.5, required: false })
  price?: number;
}