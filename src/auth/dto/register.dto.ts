import { IsEmail, IsString, MinLength, Matches, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @IsEmail({}, { message: 'O e-mail deve ser válido' })
  @ApiProperty({ description: 'E-mail do usuário', example: 'user@example.com' })
  email: string;

  @IsString({ message: 'A senha deve ser uma string' })
  @MinLength(6, { message: 'A senha deve ter pelo menos 6 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'A senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número',
  })
  @ApiProperty({ description: 'Senha do usuário', example: 'Pass123' })
  password: string;

  @IsString({ message: 'O nome deve ser uma string' })
  @ApiProperty({ description: 'Nome do usuário', example: 'Maria Silva' })
  name: string;

  @IsOptional()
  @IsString({ message: 'O nome da confeitaria deve ser uma string' })
  @ApiProperty({ description: 'Nome da confeitaria', example: 'Doce Maria', required: false })
  nameConfectionery?: string;

  @IsOptional()
  @IsString({ message: 'O telefone deve ser uma string' })
  @Matches(/^\+\d{10,15}$/, { message: 'O telefone deve estar no formato E.164 (ex.: +5511999999999)' })
  @ApiProperty({ description: 'Telefone do usuário', example: '+5511999999999', required: false })
  phone?: string;
}