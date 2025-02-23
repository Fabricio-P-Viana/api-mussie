import { Controller, Get, Post, Body, Param, UseGuards, Query, UseInterceptors, UploadedFile, ParseIntPipe } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RecipesService } from './recipes.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { PaginationPipe } from '../common/pipes/pagination.pipe';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth, ApiConsumes, ApiBody, ApiParam } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from 'src/auth/entities/user.entity';

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
        servings: { type: 'number', minimum: 1 },
        ingredients: { type: 'array', items: { type: 'object', properties: { ingredientId: { type: 'number' }, amount: { type: 'number' } } } },
        image: { type: 'string', format: 'binary' },
      },
      required: ['name', 'ingredients'],
    },
  })
  @ApiResponse({ status: 201, description: 'Receita criada' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  create(
    @Body() createRecipeDto: CreateRecipeDto,
    @UploadedFile() image: Express.Multer.File | undefined,
    @CurrentUser() user: { userId: number; email: string },
  ) {
    return this.recipesService.create(createRecipeDto, image, { id: user.userId } as User);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todas as receitas do usuário com paginação' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Lista de receitas' })
  findAll(
    @Query(new PaginationPipe()) pagination: { skip: number; take: number },
    @CurrentUser() user: { userId: number; email: string },
  ) {
    return this.recipesService.findAll(pagination, user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca uma receita do usuário por ID' })
  @ApiParam({ name: 'id', type: Number, description: 'ID da receita' })
  @ApiResponse({ status: 200, description: 'Receita encontrada' })
  @ApiResponse({ status: 400, description: 'ID inválido' })
  @ApiResponse({ status: 404, description: 'Receita não encontrada' })
  findOne(
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: 400 })) id: number,
    @CurrentUser() user: { userId: number; email: string },
  ) {
    return this.recipesService.findOne(id, user.userId);
  }

  @Post(':id/execute')
  @ApiOperation({ summary: 'Executa uma receita do usuário e atualiza o estoque' })
  @ApiParam({ name: 'id', type: Number, description: 'ID da receita' })
  @ApiBody({ schema: { type: 'object', properties: { servings: { type: 'number', minimum: 1 } } } })
  @ApiResponse({ status: 200, description: 'Receita executada' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  execute(
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: 400 })) id: number,
    @Body('servings', new ParseIntPipe({ errorHttpStatusCode: 400 })) servings: number,
    @CurrentUser() user: { userId: number; email: string },
  ) {
    return this.recipesService.executeRecipe(id, servings, user.userId);
  }
}