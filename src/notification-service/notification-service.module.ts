import { Module } from '@nestjs/common';
import { NotificationServiceController } from './notification-service.controller.js';

@Module({
  controllers: [NotificationServiceController],
})
export class NotificationServiceModule {}
