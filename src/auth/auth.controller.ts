import { Controller, Post, Body, UseInterceptors, UploadedFile, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('auth') // Agrupa endpoints sob a tag "auth"
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Cadastra um novo usuário' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'Usuário cadastrado', type: Object }) // Retorna token
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Faz login e retorna JWT' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login bem-sucedido', type: Object }) // Retorna token
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Solicita redefinição de senha' })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({ status: 200, description: 'E-mail enviado' })
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Redefine a senha com token' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({ status: 200, description: 'Senha redefinida' })
  @ApiResponse({ status: 401, description: 'Token inválido ou expirado' })
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Post('upload-profile-image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Faz upload da imagem de perfil' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Imagem enviada', type: Object }) // Retorna caminho
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  uploadProfileImage(@UploadedFile() file: Express.Multer.File) {
    return this.authService.uploadProfileImage(file);
  }
}