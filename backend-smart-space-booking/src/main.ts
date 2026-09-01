import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Global Prefix API
  app.setGlobalPrefix('api');

  // 2. Setup CORS Fleksibel (Localhost, Production Domain, Postman, Swagger)
  app.enableCors({
    origin: (origin, callback) => {
      if (
        !origin ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1') ||
        origin.includes('budayakita.com')
      ) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
  });

  // 3. Global Validation Pipe (Validasi DTO otomatis)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // 4. Setup Dokumentasi API (Swagger)
  const config = new DocumentBuilder()
    .setTitle('Smart Space Booking API')
    .setDescription(
      'Dokumentasi RESTful API untuk Sistem Reservasi Coworking Space & Workstation (UKK RPL 2026/2027)',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // 5. Dynamic Port Binding untuk Phusion Passenger cPanel
  const port = process.env.PORT || 8000;
  await app.listen(port);
  console.log(`\n🚀 Backend Server berjalan di: http://localhost:${port}/api`);
  console.log(`📑 Swagger Documentation: http://localhost:${port}/api/docs\n`);
}
bootstrap();