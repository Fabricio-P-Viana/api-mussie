import { Injectable, BadRequestException } from '@nestjs/common';
import { existsSync, writeFileSync } from 'fs';
import { join } from 'path';

@Injectable()
export class UploadsService {
  private readonly uploadPath = './uploads';

  constructor() {
    if (!existsSync(this.uploadPath)) {
      throw new Error('Diretório ./uploads não foi criado corretamente');
    }
  }

  async saveImage(file: Express.Multer.File, type: 'user' | 'recipe'): Promise<string> {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo foi enviado');
    }
    console.log('Arquivo recebido no UploadsService:', file);

    if (!file.filename || !file.path) {
      throw new BadRequestException('Arquivo não foi processado corretamente pelo Multer');
    }

    const filePath = `/uploads/${file.filename}`;
    const fullPath = join(__dirname, '..', '..', 'uploads', file.filename);

    // Verifica se o arquivo existe no disco
    if (!existsSync(fullPath)) {
      console.error('Arquivo não encontrado no disco, tentando salvar manualmente:', fullPath);
      try {
        writeFileSync(fullPath, file.buffer); // Salva manualmente usando o buffer
        console.log('Arquivo salvo manualmente:', fullPath);
      } catch (error) {
        throw new BadRequestException(`Erro ao salvar arquivo: ${error.message}`);
      }
    } else {
      console.log('Arquivo já existe no disco:', fullPath);
    }

    return filePath;
  }

  getFilePath(filename: string): string {
    return join(__dirname, '..', '..', 'uploads', filename);
  }
}