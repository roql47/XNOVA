import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  const configService = app.get(ConfigService);
  
  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // CORS configuration - 특정 origin만 허용
  const allowedOrigins = configService.get<string[]>('cors.origins') || ['http://localhost:3000'];
  
  app.enableCors({
    origin: (origin, callback) => {
      // 모바일 앱이나 서버-서버 요청은 origin이 없을 수 있음
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // API prefix
  app.setGlobalPrefix('api');

  const port = configService.get<number>('port') || 3000;
  
  await app.listen(port);
  console.log(`🚀 XNOVA Server is running on: http://localhost:${port}/api`);
}
bootstrap();
