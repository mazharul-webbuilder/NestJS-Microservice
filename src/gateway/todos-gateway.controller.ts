import { Controller, Get, Post, Body, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Controller('todos')
export class TodosGatewayController {
  constructor(
    @Inject('TODO_SERVICE') private readonly todoClient: ClientProxy,
  ) {}

  @Get()
  getTodos() {
    console.log('🌐 [API Gateway] Received HTTP GET /api/todos -> Forwarding to TCP Microservice...');
    // client.send() is SYNCHRONOUS RPC: sends message pattern and waits for response
    return this.todoClient.send({ cmd: 'get_todos' }, {});
  }

  @Post()
  createTodo(@Body() body: { title: string }) {
    console.log('🌐 [API Gateway] Received HTTP POST /api/todos -> Forwarding to TCP Microservice...');
    return this.todoClient.send({ cmd: 'create_todo' }, body);
  }
}
