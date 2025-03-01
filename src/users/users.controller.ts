import { Controller, Get, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly authService: AuthService) {}

  @Get('me') // Novo endpoint para obter dados do usuário autenticado
  @UseGuards(JwtAuthGuard) // Protege o endpoint com autenticação JWT
  @ApiOperation({ summary: 'Obtém os dados do usuário autenticado' })
  @ApiResponse({ status: 200, description: 'Dados do usuário retornados com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async getCurrentUser(@CurrentUser() user: { userId: number; email: string }) {
    const userData = await this.authService.getUserProfile(user.userId); // Método a ser criado
    return {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      profileImage: userData.profileImage,
      nameConfectionery: userData.nameConfectionery,
      phone: userData.phone,
    };
  }

  @Get(':userId/portfolio')
  @ApiOperation({ summary: 'Obtém o portfólio público de um usuário' })
  @ApiResponse({ status: 200, description: 'Portfólio retornado com sucesso' })
  @ApiResponse({ status: 400, description: 'Usuário não encontrado' })
  async getPortfolio(@Param('userId', ParseIntPipe) userId: number) {
    return this.authService.getPortfolio(userId);
  }
}