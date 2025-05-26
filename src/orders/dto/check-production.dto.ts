import { ApiProperty } from '@nestjs/swagger';

export class CheckProductionResponseDto {
  @ApiProperty({ description: 'Se é possível produzir todo o pedido' })
  canProduce: boolean;

  @ApiProperty({ 
    description: 'Lista de ingredientes faltantes e quantidades necessárias',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        ingredientId: { type: 'number' },
        name: { type: 'string' },
        amountNeeded: { type: 'number' },
        unit: { type: 'string' },
        currentStock: { type: 'number' },
      }
    },
    required: false 
  })
  shoppingList?: Array<{
    ingredientId: number;
    name: string;
    amountNeeded: number;
    unit: string;
    currentStock: number;
  }>;
}