// src/uploads/uploads.controller.ts
import { Controller, Post, UploadedFile, UseInterceptors, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadsService } from './uploads.service';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('uploads')
@Controller('uploads')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('user')
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Upload de imagem de perfil do usuário' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Imagem enviada com sucesso' })
  @ApiResponse({ status: 400, description: 'Erro no upload da imagem' })
  async uploadUserImage(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: { userId: number; email: string },
  ) {
    const filePath = await this.uploadsService.saveImage(file, 'user');
    return { imageUrl: filePath };
  }

  @Post('recipe')
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Upload de imagem para receita' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Imagem enviada com sucesso' })
  @ApiResponse({ status: 400, description: 'Erro no upload da imagem' })
  async uploadRecipeImage(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: { userId: number; email: string },
  ) {
    const filePath = await this.uploadsService.saveImage(file, 'recipe');
    return { imageUrl: filePath };
  }
}