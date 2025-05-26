import { IsNumber, IsPositive, IsString, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class RegisterWasteDto {
  @IsNumber()
  @IsPositive()
  ingredientId: number;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => value ? Number(value) : undefined)
  recipeId?: number;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => value ? Number(value) : undefined)
  orderId?: number;
}