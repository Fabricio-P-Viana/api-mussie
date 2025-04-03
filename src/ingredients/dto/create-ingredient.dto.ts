import { IsNumber, Min, IsDateString, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateIngredientDto {
  @IsString({ message: 'O nome deve ser uma string' })
  @ApiProperty({ description: 'Nome do ingrediente', example: 'Farinha' })
  name: string;

  @IsNumber({}, { message: 'O estoque deve ser um número' })
  @Min(0, { message: 'O estoque não pode ser negativo' })
  @ApiProperty({ description: 'Quantidade em estoque', example: 1500 })
  stock: number;

  @IsNumber({}, { message: 'O fator de perda fixa deve ser um número' })
  @Min(0, { message: 'O fator de perda fixa não pode ser negativo' })
  @ApiProperty({ description: 'Fator de perda fixa (percentual)', example: 0.05 })
  fixedWasteFactor: number;

  @IsNumber({}, { message: 'O fator de perda variável deve ser um número' })
  @Min(0, { message: 'O fator de perda variável não pode ser negativo' })
  @ApiProperty({ description: 'Fator de perda variável (percentual)', example: 0.02 })
  variableWasteFactor: number;

  @IsDateString({}, { message: 'A data de validade deve ser uma data válida' })
  @ApiProperty({ description: 'Data de validade do ingrediente', example: '2025-12-31' })
  expirationDate: string;

  @IsString({ message: 'A unidade deve ser uma string' })
  @ApiProperty({ description: 'Unidade de medida', example: 'g' })
  unity: string;

  @IsString({ message: 'A categoria deve ser uma string' })
  @ApiProperty({ description: 'Categoria do ingrediente', example: 'Doces', required: false })
  category?: string;

  @IsNumber({}, { message: 'O estoque mínimo deve ser um número' })
  @Min(0, { message: 'O estoque mínimo não pode ser negativo' })
  @ApiProperty({ description: 'Estoque mínimo', example: 100 })
  minimumStock: number;

  @IsNumber({}, { message: 'O preço deve ser um número' })
  @Min(0, { message: 'O preço não pode ser negativo' })
  @ApiProperty({ description: 'Preço do ingrediente (em reais)', example: 10.5, required: false })
  price?: number;
}