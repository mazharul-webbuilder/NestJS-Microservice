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
    ]),
  ],
  controllers: [TodoServiceController],
})
export class TodoServiceModule {}

