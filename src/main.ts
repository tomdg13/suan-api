import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import { mkdirSync } from 'fs';
import { AppModule } from './app.module';

async function bootstrap() {
  // Make sure the uploads folders exist before serving/writing to them.
  mkdirSync(join(__dirname, '..', 'uploads', 'stores'), { recursive: true });
  mkdirSync(join(__dirname, '..', 'uploads', 'products'), { recursive: true });
  mkdirSync(join(__dirname, '..', 'uploads', 'banners'), { recursive: true });
  mkdirSync(join(__dirname, '..', 'uploads', 'payment-qr'), { recursive: true });
  mkdirSync(join(__dirname, '..', 'uploads', 'avatars'), { recursive: true });

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors();
  app.setGlobalPrefix('api');

  // Serve uploaded images at the ROOT of the app (not under /api), so
  // e.g. http://localhost:2332/uploads/stores/xyz.jpg works directly.
  app.useStaticAssets(join(__dirname, '..', 'uploads'), { prefix: '/uploads/' });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Suan Market API running on http://localhost:${port}/api`);
  console.log(`Uploaded images served from http://localhost:${port}/uploads`);
}
bootstrap();
