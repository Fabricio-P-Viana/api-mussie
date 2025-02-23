import { IsNumber, Min } from 'class-validator';
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
}