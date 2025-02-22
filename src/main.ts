import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Configuração do Swagger
  const config = new DocumentBuilder()
    .setTitle('Confeitaria API - Mossie')
    .setDescription('API para gerenciamento de estoque e pedidos de uma confeitaria')
    .setVersion('1.0')
    .addBearerAuth( // Adiciona autenticação JWT
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'JWT-auth', // Nome da autenticação
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document); // Disponibiliza em /api

  app.useGlobalPipes(new ValidationPipe());
  const port = configService.get<number>('APP_PORT') || 3000;
  await app.listen(port);
  console.log(`API rodando em http://localhost:${port}`);
  console.log(`Documentação Swagger disponível em http://localhost:${port}/api`);
}
bootstrap();