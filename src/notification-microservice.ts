import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { NotificationServiceModule } from './notification-service/notification-service.module.js';

/**
 * 🔔 NOTIFICATION MICROSERVICE (Multi-Transport Consumer)
 * - 1. Redis Pub/Sub (Port 6379) for 'todo.created' events
 * - 2. RabbitMQ (CloudAMQP) for 'todo.updated' events with Manual ACKs
 * - 3. Apache Kafka (Redpanda Cloud) for 'todo.deleted' partitioned event stream
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
      noAck: false, // 💡 MANUAL ACKNOWLEDGMENT
      queueOptions: {
        durable: true,
      },
    },
  });

  // 3. ⚡ Apache Kafka Transport (Redpanda Cloud)
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        brokers: ['daj4raq7294n2a8ct8j0.any.ap-south-1.mpx.prd.cloud.redpanda.com:9092'],
        ssl: true,
        sasl: {
          mechanism: 'scram-sha-256',
          username: 'mazharul',
          password: 'NestMicroservice2026!',
        },
      },
      consumer: {
        groupId: 'notification-consumer-group', // Kafka Consumer Group
      },
      subscribe: {
        fromBeginning: true,
      },
    },
  });

  await app.startAllMicroservices();
  console.log('🚀 [Notification Microservice] Listening to Redis, RabbitMQ & Kafka (Redpanda Cloud)!');
}

await bootstrap();
