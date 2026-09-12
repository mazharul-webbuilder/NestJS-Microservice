import {
  Controller,
  Get,
  Post,
  Body,
  Inject,
  Param,
  Query,
  ParseIntPipe,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { timeout, catchError, TimeoutError, of } from 'rxjs';
import { CreateTodoDto } from '../common/dto/create-todo.dto.js';

@Controller('todos')
export class TodosGatewayController {
  constructor(
    @Inject('TODO_SERVICE') private readonly todoClient: ClientProxy,
  ) { }

  // =========================================================================
  // Standard RPC Call (Original method - kept untouched!)
  // =========================================================================
  @Get()
  getTodos() {
    console.log('🌐 [API Gateway] Received HTTP GET /api/todos -> Forwarding to TCP Microservice...');
    // client.send() is SYNCHRONOUS RPC: sends message pattern and waits for response
    return this.todoClient.send({ cmd: 'get_todos' }, {});
  }

  // =========================================================================
  // 🛡️ NEW METHOD: Resilient RPC with Timeout & Graceful Fallback
  // If microservice is slow or offline, return fallback data instead of 500
  // Test slow mode: GET /api/todos/resilient?slow=true
  // =========================================================================
  @Get('resilient')
  getTodosResilient(@Query('slow') slow?: string) {
    const cmd = slow === 'true' ? 'get_todos_slow' : 'get_todos';
    console.log(`🌐 [API Gateway] Calling TCP microservice (${cmd}) with 2-second timeout protection...`);

    return this.todoClient.send({ cmd }, {}).pipe(
      // ⏱️ TIMEOUT: If microservice takes longer than 2000ms, abort the request!
      timeout(2000),

      // 🛡️ FALLBACK: Catch errors gracefully
      catchError((err) => {
        if (err instanceof TimeoutError) {
          console.error('⚠️ [API Gateway] TCP Microservice TIMED OUT (> 2000ms)! Returning fallback...');
          return of({
            status: 'degraded',
            warning: 'Todo microservice took too long to respond (> 2000ms). Returning cached fallback data.',
            data: [
              { id: 0, title: 'Fallback Todo (Service Degraded)', completed: false },
            ],
          });
        }

        console.error('⚠️ [API Gateway] TCP Microservice connection failed:', err.message);
        throw new HttpException(
          {
            statusCode: HttpStatus.SERVICE_UNAVAILABLE,
            message: 'Todo Microservice is offline or unreachable.',
          },
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }),
    );
  }

  // =========================================================================
  // 🎯 NEW METHOD: Forwarding Microservice Errors (RpcException -> HttpException)
  // Microservice throws RpcException(404) -> Gateway maps to HTTP 404
  // =========================================================================
  @Get(':id')
  getTodoById(@Param('id', ParseIntPipe) id: number) {
    console.log(`🌐 [API Gateway] Forwarding GET /api/todos/${id} to TCP Microservice...`);
    return this.todoClient.send({ cmd: 'get_todo_by_id' }, id).pipe(
      catchError((err) => {
        // err contains the payload thrown by new RpcException(...) in Todo Microservice
        const status = err?.statusCode || HttpStatus.INTERNAL_SERVER_ERROR;
        const message = err?.message || 'Error occurred in microservice';
        throw new HttpException({ statusCode: status, message }, status);
      }),
    );
  }

  // =========================================================================
  // Standard Create Todo with Redis Pub/Sub (Original method - kept untouched!)
  // =========================================================================
  @Post()
  createTodo(@Body() createTodoDto: CreateTodoDto) {
    console.log('🌐 [API Gateway] Validated HTTP POST /api/todos payload:', createTodoDto);
    console.log('🌐 [API Gateway] Forwarding validated payload to TCP Microservice...');
    // client.send() is SYNCHRONOUS RPC: sends message pattern and waits for response
    return this.todoClient.send({ cmd: 'create_todo' }, createTodoDto);
  }
}
