import { Controller, Get, Post, Body, Param, Put, UseGuards, Query, ParseIntPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IngredientsService } from './ingredients.service';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { PaginationPipe } from '../common/pipes/pagination.pipe';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('ingredients')
@Controller('ingredients')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class IngredientsController {
  constructor(private readonly ingredientsService: IngredientsService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um novo ingrediente' })
  @ApiResponse({ status: 201, description: 'Ingrediente criado' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async create(@Body() createIngredientDto: CreateIngredientDto) {
    const ingredient = await this.ingredientsService.create(createIngredientDto);
    return { success: true, data: ingredient };
  }

  @Get()
  @ApiOperation({ summary: 'Lista todos os ingredientes do usuário autenticado com paginação' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Página (padrão: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Itens por página (padrão: 10)' })
  @ApiResponse({ status: 200, description: 'Lista de ingredientes do usuário' })
  async findAll(
    @Query(new PaginationPipe()) pagination: { skip: number; take: number },
    @CurrentUser() user: { userId: number; email: string }, // Extrai userId do token
  ) {
    const result = await this.ingredientsService.findAll(pagination, user.userId); // Passa userId
    return { success: true, data: result };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um ingrediente por ID' })
  @ApiParam({ name: 'id', type: Number, description: 'ID do ingrediente' })
  @ApiResponse({ status: 200, description: 'Ingrediente encontrado' })
  @ApiResponse({ status: 400, description: 'ID inválido' })
  @ApiResponse({ status: 404, description: 'Ingrediente não encontrado' })
  async findOne(@Param('id', new ParseIntPipe({ errorHttpStatusCode: 400 })) id: number) {
    const ingredient = await this.ingredientsService.findOne(id);
    if (!ingredient) throw new NotFoundException('Ingrediente não encontrado');
    return { success: true, data: ingredient };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualiza um ingrediente' })
  @ApiParam({ name: 'id', type: Number, description: 'ID do ingrediente' })
  @ApiResponse({ status: 200, description: 'Ingrediente atualizado' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Ingrediente não encontrado' })
  async update(
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: 400 })) id: number,
    @Body() updateIngredientDto: UpdateIngredientDto,
  ) {
    const ingredient = await this.ingredientsService.update(id, updateIngredientDto);
    if (!ingredient) throw new NotFoundException('Ingrediente não encontrado');
    return { success: true, data: ingredient };
  }

  @Put(':id/adjust-waste')
  @ApiOperation({ summary: 'Ajusta o fator de perda variável do ingrediente' })
  @ApiParam({ name: 'id', type: Number, description: 'ID do ingrediente' })
  @ApiBody({ schema: { type: 'object', properties: { realStock: { type: 'number', minimum: 0 } } } })
  @ApiResponse({ status: 200, description: 'Fator ajustado' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Ingrediente não encontrado' })
  async adjustWaste(
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: 400 })) id: number,
    @Body('realStock', new ParseIntPipe({ errorHttpStatusCode: 400 })) realStock: number,
  ) {
    if (realStock < 0) throw new BadRequestException('O estoque real não pode ser negativo');
    const ingredient = await this.ingredientsService.adjustVariableWasteFactor(id, realStock);
    if (!ingredient) throw new NotFoundException('Ingrediente não encontrado');
    return { success: true, data: ingredient };
  }
}