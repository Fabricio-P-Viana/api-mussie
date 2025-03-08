import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReportsService } from './reports.service';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('reports')
@Controller('reports')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ReportsController {
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
    return this.reportsService.getRevenueByPeriod(user.userId, startDate, endDate);
  }

  @Get('popular-recipes')
  @ApiOperation({ summary: 'Obtém receitas mais populares por período' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  @ApiResponse({ status: 200, description: 'Receitas retornadas' })
  getPopularRecipes(
    @CurrentUser() user: { userId: number; email: string },
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getPopularRecipes(user.userId, startDate, endDate);
  }
}