import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NotificationServiceController } from './notification-service.controller.js';
import { EmailConsumer } from './email.consumer.js';

@Module({
  imports: [
    // 📬 Connect to Redis for BullMQ persistent queues
    BullModule.forRoot({
      connection: {
        host: '127.0.0.1',
        port: 6379,
      },
    }),
    BullModule.registerQueue({
      name: 'email-queue',
    }),
  ],
  controllers: [NotificationServiceController],
  providers: [EmailConsumer],
})
export class NotificationServiceModule {}
