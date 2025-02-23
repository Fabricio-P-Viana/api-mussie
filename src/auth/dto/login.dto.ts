import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @IsEmail({}, { message: 'O e-mail deve ser válido' })
  @ApiProperty({ description: 'E-mail do usuário', example: 'user@example.com' })
  email: string;

  @IsString({ message: 'A senha deve ser uma string' })
  @ApiProperty({ description: 'Senha do usuário', example: 'Pass123' })
  password: string;
}