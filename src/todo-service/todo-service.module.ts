import { Module } from '@nestjs/common';
import { TodoServiceController } from './todo-service.controller.js';

@Module({
  controllers: [TodoServiceController],
})
export class TodoServiceModule {}
