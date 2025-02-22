export class CreateRecipeDto {
  name: string;
  servings?: number;
  ingredients: { ingredientId: number; amount: number }[];
}