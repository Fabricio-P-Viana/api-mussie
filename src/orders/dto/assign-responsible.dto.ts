import { IsString, IsNotEmpty, MinLength, MaxLength, Matches } from 'class-validator';

export class AssignResponsibleDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[a-zA-ZÀ-ÿ\s]+$/, {
    message: 'O nome deve conter apenas letras',
  })
  responsible: string;
}