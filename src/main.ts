import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter as BullExpressAdapter } from '@bull-board/express';
import { createBullBoard } from '@bull-board/api';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

    // Configuração do Bull Board
    const bullBoardAdapter = new BullExpressAdapter();
    bullBoardAdapter.setBasePath('/admin/queues');
  
    createBullBoard({
      queues: [new BullAdapter(app.get('BullQueue_mailQueue'))],
      serverAdapter: bullBoardAdapter,
    });
  
    app.use('/admin/queues', bullBoardAdapter.getRouter());

  app.enableCors({
    origin: '*', // Permite qualquer origem
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Métodos permitidos
    allowedHeaders: 'Content-Type, Authorization', // Headers permitidos
    credentials: true, // Permite envio de cookies ou credenciais (se necessário)
  });
  
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) => {
        const messages = errors.map(error => ({
          property: error.property,
          constraints: error.constraints,
        }));
        throw new BadRequestException(messages);
      },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Confeitaria API - Mussie')
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
  console.log(`Bull-Board disponível em http://localhost:${port}/admin/queues`);
  console.log(`pgadmin disponível em http://localhost:5050/ email=admin@admin.com password=admin`);
}
bootstrap();