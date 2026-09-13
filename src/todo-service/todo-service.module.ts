import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TodoServiceController } from './todo-service.controller.js';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'REDIS_SERVICE',
        transport: Transport.REDIS,
        options: {
          host: '127.0.0.1',
          port: 6379,
        },
      },
      // 🐇 Register RabbitMQ Producer Client
      {
        name: 'RABBITMQ_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [
            'amqps://hzvmqvip:qKu9jZ0N5N3i4_uAze4Rx9Zj4C2TLnxb@warthog.lmq.cloudamqp.com/hzvmqvip',
          ],
          queue: 'todo_updates_queue',
          queueOptions: {
            durable: true,
          },
        },
      },
      // ⚡ Register Apache Kafka Producer Client
      {
        name: 'KAFKA_SERVICE',
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
          producer: {
            allowAutoTopicCreation: true,
          },
        },
      },
    ]),
  ],
  controllers: [TodoServiceController],
})
export class TodoServiceModule {}

