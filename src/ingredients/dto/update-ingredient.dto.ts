import { IsNumber, Min, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateIngredientDto {
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
}