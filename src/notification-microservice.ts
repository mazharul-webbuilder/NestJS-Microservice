import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { NotificationServiceModule } from './notification-service/notification-service.module.js';

/**
 * 🔔 NOTIFICATION MICROSERVICE (Redis Pub/Sub Subscriber)
 * - Acts as a CLIENT connecting to the Redis message broker (not an open server port).
 * - Port 6379 is Redis's port where this service connects to subscribe to events.
 * - Listens asynchronously for broadcasted events (e.g., todo_created) without blocking HTTP requests.
 */
async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    NotificationServiceModule,
    {
      transport: Transport.REDIS,
      options: {
        host: '127.0.0.1',
        port: 6379, // Redis broker port (Notification connects TO this, doesn't open it)
      },
    },
  );

  await app.listen();
  console.log('🚀 [Notification Microservice] Listening to Redis Pub/Sub on 127.0.0.1:6379');
}

await bootstrap();
