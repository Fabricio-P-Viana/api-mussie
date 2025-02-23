import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @IsString({ message: 'O refresh token deve ser uma string' })
  @ApiProperty({ description: 'Token de atualização', example: 'jwt.refresh.token' })
  refreshToken: string;
}