import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly authService: AuthService) {}

  @Get(':userId/portfolio')
  @ApiOperation({ summary: 'Obtém o portfólio público de um usuário' })
  @ApiResponse({ status: 200, description: 'Portfólio retornado com sucesso' })
  @ApiResponse({ status: 400, description: 'Usuário não encontrado' })
  async getPortfolio(@Param('userId', ParseIntPipe) userId: number) {
    return this.authService.getPortfolio(userId);
  }
}