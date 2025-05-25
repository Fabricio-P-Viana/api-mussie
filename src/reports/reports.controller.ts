import { Controller, Get, Logger, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReportsService } from './reports.service';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('reports')
@Controller('reports')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ReportsController {
  private readonly logger = new Logger(ReportsService.name);
  constructor(private readonly reportsService: ReportsService) {}

  @Get('orders')
  @ApiOperation({ summary: 'Obtém histórico de pedidos por período' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  @ApiResponse({ status: 200, description: 'Histórico retornado' })
  getOrderHistory(
    @CurrentUser() user: { userId: number; email: string },
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    this.logger.log(`Obtendo histórico de pedidos do usuário ${user.userId}`);
    return this.reportsService.getOrderHistory(user.userId, startDate, endDate);
  }

  @Get('revenue')
  @ApiOperation({ summary: 'Obtém receita total por período' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  @ApiResponse({ status: 200, description: 'Receita retornada' })
  getRevenue(
    @CurrentUser() user: { userId: number; email: string },
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    this.logger.log(`Obtendo receita do usuário ${user.userId}`);
    return this.reportsService.getRevenueByPeriod(user.userId, startDate, endDate);
  }

  @Get('popular-recipes')
  @ApiOperation({ summary: 'Obtém receitas mais populares por período' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  @ApiQuery({ name: 'includeMinimumStock', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Receitas retornadas' })
  getPopularRecipes(
    @CurrentUser() user: { userId: number; email: string },
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    this.logger.log(`Obtendo receitas populares do usuário ${user.userId}`);
    return this.reportsService.getPopularRecipes(user.userId, startDate, endDate);
  }

  @Get('shopping-list')
  async getShoppingList(
    @CurrentUser() user: { userId: number; email: string },
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('includeMinimumStock') includeMinimumStock: boolean,
  ) {
    this.logger.log(`Obtendo lista de compras do usuário ${user.userId}`);
    return await this.reportsService.getShoppingList(user.userId, startDate, endDate, includeMinimumStock);
  }
}