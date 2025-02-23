import { IsString, IsNumber, Min, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateIngredientDto {
  @IsString({ message: 'O nome deve ser uma string' })
  @ApiProperty({ description: 'Nome do ingrediente', example: 'Nutella' })
  name: string;

  @IsNumber({}, { message: 'O estoque deve ser um número' })
  @Min(0, { message: 'O estoque não pode ser negativo' })
  @ApiProperty({ description: 'Quantidade em estoque', example: 2000 })
  stock: number;

  @IsOptional()
  @IsNumber({}, { message: 'O fator de perda fixa deve ser um número' })
  @Min(0, { message: 'O fator de perda fixa não pode ser negativo' })
  @ApiProperty({ description: 'Fator de perda fixa (percentual)', example: 0.05, required: false })
  fixedWasteFactor?: number;
}