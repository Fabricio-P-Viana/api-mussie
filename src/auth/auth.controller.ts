import { Controller, Post, Body, UseInterceptors, UploadedFile, UseGuards, Get, Param, ParseIntPipe } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto'; // Novo DTO
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiConsumes, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { BadRequestException } from '@nestjs/common';
import { UpdateUserDto } from '../users/dto/update-user.dto';
import { diskStorage } from 'multer';
import { extname } from 'path';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Cadastra um novo usuário' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'Usuário cadastrado', type: Object })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Faz login e retorna JWT' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login bem-sucedido', type: Object })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Solicita redefinição de senha' })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({ status: 200, description: 'E-mail enviado' })
  @ApiResponse({ status: 400, description: 'E-mail inválido' })
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Redefine a senha com token' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({ status: 200, description: 'Senha redefinida' })
  @ApiResponse({ status: 401, description: 'Token inválido ou expirado' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Post('upload-profile-image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image', {
    storage: diskStorage({
      destination: './uploads', // Mesmo diretório usado para receitas
      filename: (req, file, callback) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        callback(null, `${uniqueSuffix}${ext}`);
      },
    }),
    fileFilter: (req, file, callback) => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.mimetype)) {
        return callback(new BadRequestException('Apenas arquivos de imagem são permitidos (JPEG, PNG, GIF)'), false);
      }
      callback(null, true);
    },
    limits: { fileSize: 5 * 1024 * 1024 }, // Limite de 5MB
  }))
  @ApiOperation({ summary: 'Faz upload da imagem de perfil do usuário autenticado' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: { type: 'string', format: 'binary' },
      },
      required: ['image'],
    },
  })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'Imagem enviada', type: Object })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 400, description: 'Arquivo de imagem ausente ou usuário inválido' })
  uploadProfileImage(
    @CurrentUser() user: { userId: number; email: string },
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.authService.uploadProfileImage(user.userId, file);
  }

  @Post('update-profile')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Atualiza o perfil do usuário' })
  @ApiBody({ type: UpdateUserDto })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'Perfil atualizado', type: Object })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  updateProfile(
    @CurrentUser() user: { userId: number; email: string },
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.authService.updateProfile(user.userId, updateUserDto);
  }

  @Post('refresh-token')
  @ApiOperation({ summary: 'Atualiza o access token usando o refresh token' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({ status: 200, description: 'Tokens atualizados', type: Object })
  @ApiResponse({ status: 401, description: 'Refresh token inválido ou expirado' })
  refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto);
  }
  
  @Get('/users/:userId/portfolio')
  @ApiOperation({ summary: 'Obtém o portfólio público de um usuário' })
  @ApiResponse({ status: 200, description: 'Portfólio retornado com sucesso' })
  @ApiResponse({ status: 400, description: 'Usuário não encontrado' })
  async getPortfolio(@Param('userId', ParseIntPipe) userId: number) {
    return this.authService.getPortfolio(userId);
  }
}