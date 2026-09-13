import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { NotificationServiceModule } from './notification-service/notification-service.module.js';

/**
 * 🔔 NOTIFICATION MICROSERVICE (Multi-Transport Consumer)
 * - Connects to Redis Pub/Sub (Port 6379) for 'todo.created' events
 * - Connects to RabbitMQ (CloudAMQP) for 'todo.updated' events with Manual ACKs (noAck: false)
 */
async function bootstrap() {
  const app = await NestFactory.create(NotificationServiceModule);

  // 1. Redis Pub/Sub Transport
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.REDIS,
    options: {
      host: '127.0.0.1',
      port: 6379,
    },
  });

  // 2. 🐇 RabbitMQ Transport (CloudAMQP)
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [
        'amqps://hzvmqvip:qKu9jZ0N5N3i4_uAze4Rx9Zj4C2TLnxb@warthog.lmq.cloudamqp.com/hzvmqvip',
      ],
      queue: 'todo_updates_queue',
      noAck: false, // 💡 MANUAL ACKNOWLEDGMENT: Message is only deleted once worker confirms channel.ack()!
      queueOptions: {
        durable: true, // Queue survives broker restarts
      },
    },
  });

  await app.startAllMicroservices();
  console.log('🚀 [Notification Microservice] Listening to Redis Pub/Sub (127.0.0.1:6379) & CloudAMQP (todo_updates_queue)');
}

await bootstrap();
