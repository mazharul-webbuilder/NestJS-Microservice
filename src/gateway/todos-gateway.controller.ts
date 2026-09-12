import { Controller, Get, Post, Body, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CreateTodoDto } from '../common/dto/create-todo.dto.js';

@Controller('todos')
export class TodosGatewayController {
  constructor(
    @Inject('TODO_SERVICE') private readonly todoClient: ClientProxy,
  ) { }

  @Get()
  getTodos() {
    console.log('🌐 [API Gateway] Received HTTP GET /api/todos -> Forwarding to TCP Microservice...');
    // client.send() is SYNCHRONOUS RPC: sends message pattern and waits for response
    return this.todoClient.send({ cmd: 'get_todos' }, {});
  }

  @Post()
  createTodo(@Body() createTodoDto: CreateTodoDto) {
    console.log('🌐 [API Gateway] Validated HTTP POST /api/todos payload:', createTodoDto);
    console.log('🌐 [API Gateway] Forwarding validated payload to TCP Microservice...');
    // client.send() is SYNCHRONOUS RPC: sends message pattern and waits for response
    return this.todoClient.send({ cmd: 'create_todo' }, createTodoDto);
  }
}
