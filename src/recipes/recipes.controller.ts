import { Controller, Get, Post, Body, Param, UseGuards, Query, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RecipesService } from './recipes.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { PaginationPipe } from '../common/pipes/pagination.pipe';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';

@ApiTags('recipes')
@Controller('recipes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Cria uma nova receita com imagem opcional' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        servings: { type: 'number' },
        ingredients: { type: 'array', items: { type: 'object', properties: { ingredientId: { type: 'number' }, amount: { type: 'number' } } } },
        image: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Receita criada' })
  create(@Body() createRecipeDto: CreateRecipeDto, @UploadedFile() image: Express.Multer.File) {
    return this.recipesService.create(createRecipeDto, image);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todas as receitas com paginação' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Lista de receitas' })
  findAll(@Query(new PaginationPipe()) pagination: { skip: number; take: number }) {
    return this.recipesService.findAll(pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca uma receita por ID' })
  @ApiResponse({ status: 200, description: 'Receita encontrada' })
  @ApiResponse({ status: 404, description: 'Receita não encontrada' })
  findOne(@Param('id') id: string) {
    return this.recipesService.findOne(+id);
  }

  @Post(':id/execute')
  @ApiOperation({ summary: 'Executa uma receita e atualiza o estoque' })
  @ApiBody({ schema: { type: 'object', properties: { servings: { type: 'number' } } } })
  @ApiResponse({ status: 200, description: 'Receita executada' })
  execute(@Param('id') id: string, @Body('servings') servings: number) {
    return this.recipesService.executeRecipe(+id, servings);
  }
}