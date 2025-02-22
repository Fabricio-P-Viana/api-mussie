export class UpdateRecipeDto {
    name?: string;
    servings?: number;
    ingredients?: { ingredientId: number; amount: number }[];
  }