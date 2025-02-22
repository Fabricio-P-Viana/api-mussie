import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @IsEmail()
  @ApiProperty({ description: 'E-mail do usuário', example: 'user@example.com' })
  email: string;

  @IsString()
  @MinLength(6)
  @ApiProperty({ description: 'Senha do usuário', example: '123456' })
  password: string;
}