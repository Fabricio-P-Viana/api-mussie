import { Controller, Get, Post, Body, Param, Put, UseGuards, Query, ParseIntPipe, Patch, Logger } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PaginationPipe } from '../common/pipes/pagination.pipe';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from 'src/users/entities/user.entity';
import { CheckProductionResponseDto } from './dto/check-production.dto';
import { Order } from './entities/order.entity';

@ApiTags('orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class OrdersController {
  private readonly logger = new Logger(OrdersService.name);
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um novo pedido para o usuário' })
  @ApiResponse({ status: 201, description: 'Pedido criado' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  create(
    @Body() createOrderDto: CreateOrderDto,
    @CurrentUser() user: { userId: number; email: string },
  ) {
    this.logger.log(`Criando pedido para o usuário ${user.userId}`);
    return this.ordersService.create(createOrderDto, { id: user.userId } as User);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todos os pedidos do usuário com paginação' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Lista de pedidos' })
  findAll(
    @Query(new PaginationPipe()) pagination: { skip: number; take: number },
    @CurrentUser() user: { userId: number; email: string },
  ) {
    this.logger.log(`Listando pedidos do usuário ${user.userId}`);
    return this.ordersService.findAll(pagination, user.userId);
  }

  @Get('pending')
  @ApiOperation({ summary: 'Obtém pedidos pendentes ordenados por data de entrega' })
  @ApiResponse({ status: 200, description: 'Lista de pedidos pendentes' })
  @ApiQuery({ name: 'startDate', required: false, type: Date, description: 'Data inicial (default: primeiro dia do mês atual)' })
  @ApiQuery({ name: 'endDate', required: false, type: Date, description: 'Data final (default: último dia do mês atual)' })
  findPendingOrders(
    @CurrentUser() user: { userId: number; email: string },
    @Query('startDate') startDate?: Date,
    @Query('endDate') endDate?: Date
  ) {
    this.logger.log(`Obtendo pedidos pendentes do usuário ${user.userId}`);
    return this.ordersService.findPendingOrders(user.userId, startDate, endDate);
  }

  @Get('history')
  @ApiOperation({ summary: 'Lista o histórico de pedidos concluídos e cancelados com paginação' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Lista de pedidos históricos' })
  findHistory(
    @Query(new PaginationPipe()) pagination: { skip: number; take: number },
    @CurrentUser() user: { userId: number; email: string },
  ) {
    this.logger.log(`Listando histórico de pedidos do usuário ${user.userId}`);
    return this.ordersService.findHistory(pagination, user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um pedido do usuário por ID' })
  @ApiParam({ name: 'id', type: Number, description: 'ID do pedido' })
  @ApiResponse({ status: 200, description: 'Pedido encontrado' })
  @ApiResponse({ status: 400, description: 'ID inválido' })
  @ApiResponse({ status: 404, description: 'Pedido não encontrado' })
  findOne(
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: 400 })) id: number,
    @CurrentUser() user: { userId: number; email: string },
  ) {
    this.logger.log(`Buscando pedido com ID ${id} do usuário ${user.userId}`);
    return this.ordersService.findOne(id, user.userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualiza um pedido do usuário (ex.: muda status)' })
  @ApiParam({ name: 'id', type: Number, description: 'ID do pedido' })
  @ApiResponse({ status: 200, description: 'Pedido atualizado' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  update(
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: 400 })) id: number,
    @Body() updateOrderDto: UpdateOrderDto,
    @CurrentUser() user: { userId: number; email: string },
  ) {
    this.logger.log(`Atualizando pedido com ID ${id} do usuário ${user.userId}`);
    return this.ordersService.update(id, updateOrderDto, user.userId);
  }

  @Get(':id/production/progress')
  @ApiOperation({ summary: 'Obtém o progresso de produção de um pedido' })
  @ApiParam({ name: 'id', type: Number, description: 'ID do pedido' })
  @ApiResponse({ status: 200, description: 'Progresso de produção encontrado' })
  @ApiResponse({ status: 404, description: 'Progresso não encontrado' })
  async getProductionProgress(
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: 400 })) id: number,
    @CurrentUser() user: { userId: number; email: string },
  ) {
    this.logger.log(`Buscando progresso de produção do pedido ${id} para o usuário ${user.userId}`);
    return this.ordersService.getProductionProgress(id, user.userId);
  }

  @Patch(':id/production/progress')
  @ApiOperation({ summary: 'Salva o progresso de produção de um pedido' })
  @ApiParam({ name: 'id', type: Number, description: 'ID do pedido' })
  @ApiResponse({ status: 200, description: 'Progresso salvo com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async saveProductionProgress(
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: 400 })) id: number,
    @Body() progressData: any,
    @CurrentUser() user: { userId: number; email: string },
  ) {
    this.logger.log(`Salvando progresso de produção do pedido ${id} para o usuário ${user.userId}`);
    return this.ordersService.saveProductionProgress(id, progressData, user.userId);
  }

  @Patch(':id/production/complete')
  @ApiOperation({ summary: 'Marca um pedido como concluído na produção' })
  @ApiParam({ name: 'id', type: Number, description: 'ID do pedido' })
  @ApiResponse({ status: 200, description: 'Pedido marcado como concluído' })
  @ApiResponse({ status: 400, description: 'Pedido já concluído ou cancelado' })
  async completeProduction(
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: 400 })) id: number,
    @CurrentUser() user: { userId: number; email: string },
  ) {
    this.logger.log(`Marcando pedido ${id} como concluído na produção para o usuário ${user.userId}`);
    return this.ordersService.completeProduction(id, user.userId);
  }

  @Patch(':id/assign-responsible')
  @ApiOperation({ summary: 'Atribui um responsável e marca o pedido como em produção' })
  @ApiParam({ name: 'id', type: Number, description: 'ID do pedido' })
  @ApiResponse({ 
    status: 200, 
    description: 'Responsável atribuído e pedido marcado como em produção',
    type: Order
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Pedido já concluído ou cancelado | Dados inválidos' 
  })
  @ApiResponse({ status: 404, description: 'Pedido não encontrado' })
  async assignResponsible(
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: 400 })) id: number,
    @Body() assignResponsibleData: { responsible: string },
    @CurrentUser() user: { userId: number; email: string },
  ) {
    return this.ordersService.assignResponsible(id, user.userId, assignResponsibleData.responsible);
  }

  @Get(':id/check-production')
  @ApiOperation({ summary: 'Verifica se é possível produzir todo o pedido e retorna lista de compras se necessário' })
  @ApiParam({ name: 'id', type: Number, description: 'ID do pedido' })
  @ApiResponse({ 
    status: 200, 
    description: 'Resultado da verificação de produção',
    type: CheckProductionResponseDto,
  })
  async checkProductionFeasibility(
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: 400 })) id: number,
    @CurrentUser() user: { userId: number; email: string },
  ) {
    this.logger.log(`Verificando viabilidade de produção para o pedido ${id} do usuário ${user.userId}`);
    return this.ordersService.checkProductionFeasibility(id, user.userId);
  }
}