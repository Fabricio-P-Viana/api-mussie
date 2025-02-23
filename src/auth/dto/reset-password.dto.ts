import { IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @IsString({ message: 'O token deve ser uma string' })
  @ApiProperty({ description: 'Token de redefinição', example: 'uuid-token' })
  token: string;

  @IsString({ message: 'A nova senha deve ser uma string' })
  @MinLength(6, { message: 'A nova senha deve ter pelo menos 6 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'A nova senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número',
  })
  @ApiProperty({ description: 'Nova senha do usuário', example: 'NewPass123' })
  newPassword: string;
}