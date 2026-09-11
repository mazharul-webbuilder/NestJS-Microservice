import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { LoggingMiddleware } from './common/middleware/logging.middleware.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
