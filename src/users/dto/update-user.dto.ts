import { IsString, IsOptional, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @IsOptional()
  @IsString({ message: 'O nome deve ser uma string' })
  @ApiProperty({ description: 'Nome do usuário', example: 'Maria Silva', required: false })
  name?: string;

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