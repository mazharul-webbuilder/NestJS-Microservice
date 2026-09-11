import { Module } from '@nestjs/common';
import { TodosController } from './todos.controller.js';
import { TodosService } from './todos.service.js';

@Module({
  controllers: [TodosController],
  providers: [TodosService]
})
export class TodosModule {}
