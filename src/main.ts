import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';
import { LoggingMiddleware } from './common/middleware/logging.middleware.js';

/**
 * 🌐 API GATEWAY (HTTP Server)
 * - Acts as the entry point for frontend clients / browsers.
 * - Listens on an HTTP port (default: 3000).
 * - Routes incoming requests to downstream microservices via TCP / Redis.
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  // 🛡️ GATEWAY FIREWALL: Validate incoming HTTP payloads before routing to microservices
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Automatically strip non-whitelisted properties
      forbidNonWhitelisted: true, // Throw an HTTP 400 error if extra unwanted properties are sent
      transform: true, // Automatically transform plain JSON into typed DTO instances
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();