import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { TodoServiceModule } from './todo-service/todo-service.module.js';

/**
 * 📦 TODO MICROSERVICE (TCP Server)
 * - Uses direct TCP transport for fast, point-to-point RPC (Request-Response).
 * - Opens and listens directly on TCP port 3001.
 * - Handles business logic for todo operations triggered by the Gateway.
 */
async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    TodoServiceModule,
    {
      transport: Transport.TCP,
      options: {
        host: '127.0.0.1',
        port: 3001, // TCP port this service opens and listens on
      },
    },
  );

  await app.listen();
  console.log('🚀 [Todo Microservice] Running and listening on TCP port 3001');
}

await bootstrap();
