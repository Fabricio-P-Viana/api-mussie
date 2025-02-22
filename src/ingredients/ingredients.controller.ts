import { Controller, Get, Post, Body, Param, Put, UseGuards, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IngredientsService } from './ingredients.service';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { PaginationPipe } from '../common/pipes/pagination.pipe';

@ApiTags('ingredients')
@Controller('ingredients')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth') // Requer autenticação JWT
export class IngredientsController {
  constructor(private readonly ingredientsService: IngredientsService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um novo ingrediente' })
  @ApiResponse({ status: 201, description: 'Ingrediente criado' })
  create(@Body() createIngredientDto: CreateIngredientDto) {
    return this.ingredientsService.create(createIngredientDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todos os ingredientes com paginação' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Página (padrão: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Itens por página (padrão: 10)' })
  @ApiResponse({ status: 200, description: 'Lista de ingredientes' })
  findAll(@Query(new PaginationPipe()) pagination: { skip: number; take: number }) {
    return this.ingredientsService.findAll(pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um ingrediente por ID' })
  @ApiResponse({ status: 200, description: 'Ingrediente encontrado' })
  @ApiResponse({ status: 404, description: 'Ingrediente não encontrado' })
  findOne(@Param('id') id: string) {
    return this.ingredientsService.findOne(+id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualiza um ingrediente' })
  @ApiResponse({ status: 200, description: 'Ingrediente atualizado' })
  update(@Param('id') id: string, @Body() updateIngredientDto: UpdateIngredientDto) {
    return this.ingredientsService.update(+id, updateIngredientDto);
  }

  @Put(':id/adjust-waste')
  @ApiOperation({ summary: 'Ajusta o fator de perda variável do ingrediente' })
  @ApiBody({ schema: { type: 'object', properties: { realStock: { type: 'number' } } } })
  @ApiResponse({ status: 200, description: 'Fator ajustado' })
  adjustWaste(@Param('id') id: string, @Body('realStock') realStock: number) {
    return this.ingredientsService.adjustVariableWasteFactor(+id, realStock);
  }
}