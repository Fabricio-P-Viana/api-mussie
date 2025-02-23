import { Controller, Get, Post, Body, Param, Put, UseGuards, Query, ParseIntPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PaginationPipe } from '../common/pipes/pagination.pipe';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from 'src/auth/entities/user.entity';

@ApiTags('orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um novo pedido para o usuário' })
  @ApiResponse({ status: 201, description: 'Pedido criado' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  create(
    @Body() createOrderDto: CreateOrderDto,
    @CurrentUser() user: { userId: number; email: string },
  ) {
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
    return this.ordersService.findAll(pagination, user.userId);
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
    return this.ordersService.update(id, updateOrderDto, user.userId);
  }
}