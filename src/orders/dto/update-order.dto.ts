import { IsEnum, IsOptional, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class RecipeStatusUpdate {
  @IsNumber()
  @ApiProperty({ description: 'ID da receita', example: 1 })
  recipeId: number;

  @IsEnum(['pending', 'in_progress', 'completed', 'canceled'])
  @ApiProperty({ description: 'Novo status da receita', enum: ['pending', 'in_progress', 'completed', 'canceled'] })
  status: 'pending' | 'in_progress' | 'completed' | 'canceled';
}
export class UpdateOrderDto {
  @IsOptional()
  @IsEnum(['pending', 'completed', 'canceled'])
  @ApiProperty({ description: 'Status geral do pedido', enum: ['pending', 'completed', 'canceled'], required: false })
  status?: 'pending' | 'completed' | 'canceled';

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipeStatusUpdate)
  @ApiProperty({ description: 'Atualizações de status por receita', type: [RecipeStatusUpdate], required: false })
  recipeUpdates?: RecipeStatusUpdate[];
}

