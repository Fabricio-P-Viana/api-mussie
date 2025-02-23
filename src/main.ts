import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: 'http://localhost:3001' });
  const configService = app.get(ConfigService);

  // Configuração do ValidationPipe com transformação e erros detalhados
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // Transforma automaticamente os dados para o tipo do DTO
      whitelist: true, // Remove propriedades não definidas no DTO
      forbidNonWhitelisted: true, // Rejeita requisições com propriedades extras
      exceptionFactory: (errors) => {
        const messages = errors.map(error => ({
          property: error.property,
          constraints: error.constraints,
        }));
        throw new BadRequestException(messages);
      },
    }),
  );

  // Configuração do Swagger (sem alterações)
  const config = new DocumentBuilder()
    .setTitle('Confeitaria API - Mossie')
    .setDescription('API para gerenciamento de estoque e pedidos de uma confeitaria')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT-auth')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = configService.get<number>('APP_PORT') || 3000;
  await app.listen(port);
  console.log(`API rodando em http://localhost:${port}`);
  console.log(`Documentação Swagger disponível em http://localhost:${port}/api`);
}
bootstrap();