import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'O e-mail deve ser válido' })
  @ApiProperty({ description: 'E-mail do usuário', example: 'user@example.com' })
  email: string;
}