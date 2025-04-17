import { Controller, Get, Post, Body, Param, UseGuards, Query, UseInterceptors, UploadedFile, ParseIntPipe, BadRequestException, Put, Logger } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RecipesService } from './recipes.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { PaginationPipe } from '../common/pipes/pagination.pipe';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth, ApiConsumes, ApiBody, ApiParam } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from 'src/users/entities/user.entity';
import { UploadsService } from 'src/uploads/uploads.service';
import { diskStorage } from 'multer';
import { extname } from 'path';

@ApiTags('recipes')
@Controller('recipes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class RecipesController {
  private readonly logger = new Logger(RecipesService.name);
  constructor(private readonly recipesService: RecipesService, private readonly uploadsService: UploadsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('image', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, callback) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        callback(null, `${uniqueSuffix}${ext}`);
      },
    }),
    fileFilter: (req, file, callback) => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml'];
      if (!allowedTypes.includes(file.mimetype)) {
        return callback(new BadRequestException('Apenas arquivos de imagem são permitidos!'), false);
      }
      callback(null, true);
    },
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  }))
  @ApiOperation({ summary: 'Cria uma nova receita com imagem opcional' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        servings: { type: 'number', minimum: 1 },
        price: { type: 'number', minimum: 0 },
        preparationTime: { type: 'number', nullable: true },
        description: { type: 'string', nullable: true },
        'ingredients[0][ingredientId]': { type: 'number', description: 'ID do primeiro ingrediente' },
        'ingredients[0][amount]': { type: 'number', description: 'Quantidade do primeiro ingrediente' },
        'ingredients[1][ingredientId]': { type: 'number', description: 'ID do segundo ingrediente (opcional)', nullable: true },
        'ingredients[1][amount]': { type: 'number', description: 'Quantidade do segundo ingrediente (opcional)', nullable: true },
        image: { type: 'string', format: 'binary' },
        showInPortifolio: { type: 'boolean', nullable: true, description: 'Exibir no portfólio (padrão: false)' },
        preparationMode: { type: 'string', nullable: true, description: 'Modo de preparo (padrão: "")' },
      },
      required: ['name', 'ingredients[0][ingredientId]', 'ingredients[0][amount]'],
    },
  })
  @ApiResponse({ status: 201, description: 'Receita criada' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async create(
    @Body() body: any,
    @UploadedFile() image: Express.Multer.File | undefined,
    @CurrentUser() user: { userId: number; email: string },
  ) {
    this.logger.log(`Criando receita para o usuário ${user.userId}`);
    console.log('Body recebido:', body);
    console.log('Imagem recebida:', image);
  
    const ingredients: { ingredientId: number; amount: number }[] = [];
    if (body.ingredients && Array.isArray(body.ingredients)) {
      body.ingredients.forEach((ing: any) => {
        const ingredientId = Number(ing.ingredientId);
        const amount = Number(ing.amount);
        if (!isNaN(ingredientId) && ingredientId > 0 && !isNaN(amount) && amount >= 0) {
          ingredients.push({ ingredientId, amount });
        }
      });
    }
  
    if (ingredients.length === 0) {
      throw new BadRequestException('Pelo menos um ingrediente válido é necessário (ingredientId > 0)');
    }
  
    const createRecipeDto: CreateRecipeDto = {
      name: body.name,
      servings: Number(body.servings),
      price: Number(body.price),
      preparationTime: body.preparationTime ? Number(body.preparationTime) : undefined,
      description: body.description || undefined,
      ingredients,
      showInPortifolio: body.showInPortifolio !== undefined ? Boolean(body.showInPortifolio) : undefined,
      preparationMode: body.preparationMode || undefined,
    };
  
    const imagePath = image ? await this.uploadsService.saveImage(image, 'recipe') : undefined;
    console.log('Caminho da imagem gerado:', imagePath);
    return this.recipesService.create(createRecipeDto, imagePath, { id: user.userId } as User);
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
    this.logger.log(`Listando receitas do usuário ${user.userId}`);
    return this.recipesService.findAll(pagination, user.userId);
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('image', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, callback) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        callback(null, `${uniqueSuffix}${ext}`);
      },
    }),
    fileFilter: (req, file, callback) => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml'];
      if (!allowedTypes.includes(file.mimetype)) {
        return callback(new BadRequestException('Apenas arquivos de imagem são permitidos!'), false);
      }
      callback(null, true);
    },
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  }))
  @ApiOperation({ summary: 'Atualiza uma receita existente do usuário' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        servings: { type: 'number', minimum: 1 },
        price: { type: 'number', minimum: 0 },
        preparationTime: { type: 'number', nullable: true },
        description: { type: 'string', nullable: true },
        'ingredients[0][ingredientId]': { type: 'number', description: 'ID do primeiro ingrediente' },
        'ingredients[0][amount]': { type: 'number', description: 'Quantidade do primeiro ingrediente' },
        'ingredients[1][ingredientId]': { type: 'number', description: 'ID do segundo ingrediente (opcional)', nullable: true },
        'ingredients[1][amount]': { type: 'number', description: 'Quantidade do segundo ingrediente (opcional)', nullable: true },
        showInPortifolio: { type: 'boolean', description: 'Exibir no portfólio' },
        preparationMode: { type: 'string', description: 'Modo de preparo' },
        image: { type: 'string', format: 'binary', description: 'Nova imagem (opcional)' },
      },
      required: ['name', 'servings', 'price', 'ingredients[0][ingredientId]', 'ingredients[0][amount]'],
    },
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID da receita' })
  @ApiResponse({ status: 200, description: 'Receita atualizada com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou receita não encontrada' })
  @ApiResponse({ status: 403, description: 'Receita não pertence ao usuário' })
  async update(
    @Param('id', new ParseIntPipe({ errorHttpStatusCode: 400 })) id: number,
    @Body() body: any,
    @UploadedFile() image: Express.Multer.File | undefined,
    @CurrentUser() user: { userId: number; email: string },
  ) {
    this.logger.log(`Atualizando receita com ID ${id} para o usuário ${user.userId}`);
    console.log('Body recebido:', body);
    console.log('Imagem recebida:', image);

    const ingredients: { ingredientId: number; amount: number }[] = [];
    if (body.ingredients && Array.isArray(body.ingredients)) {
      body.ingredients.forEach((ing: any) => {
        const ingredientId = Number(ing.ingredientId);
        const amount = Number(ing.amount);
        if (!isNaN(ingredientId) && ingredientId > 0 && !isNaN(amount) && amount >= 0) {
          ingredients.push({ ingredientId, amount });
        }
      });
    }

    if (ingredients.length === 0) {
      throw new BadRequestException('Pelo menos um ingrediente válido é necessário (ingredientId > 0)');
    }

    const updateRecipeDto: CreateRecipeDto = {
      name: body.name,
      servings: Number(body.servings),
      price: Number(body.price),
      preparationTime: body.preparationTime ? Number(body.preparationTime) : undefined,
      description: body.description || undefined,
      ingredients,
      showInPortifolio: body.showInPortifolio === 'true' || body.showInPortifolio === true,
      preparationMode: body.preparationMode || '',
    };

    const imagePath = image ? await this.uploadsService.saveImage(image, 'recipe') : undefined;
    console.log('Caminho da imagem gerado:', imagePath);
    return this.recipesService.update(id, updateRecipeDto, imagePath, { id: user.userId } as User);
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
    this.logger.log(`Buscando receita com ID ${id} do usuário ${user.userId}`);
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
    this.logger.log(`Executando receita com ID ${id} para o usuário ${user.userId}`);
    return this.recipesService.executeRecipe(id, servings, user.userId);
  }
}