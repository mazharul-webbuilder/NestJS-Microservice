import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { NotificationServiceModule } from './notification-service/notification-service.module.js';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    NotificationServiceModule,
    {
      transport: Transport.REDIS,
      options: {
        host: '127.0.0.1',
        port: 6379,
      },
    },
  );

  await app.listen();
  console.log('🚀 [Notification Microservice] Listening to Redis Pub/Sub on 127.0.0.1:6379');
}

await bootstrap();
