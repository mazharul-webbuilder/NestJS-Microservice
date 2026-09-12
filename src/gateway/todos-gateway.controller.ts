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
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { timeout, catchError, TimeoutError, of } from 'rxjs';
import { CreateTodoDto } from '../common/dto/create-todo.dto.js';

@Controller('todos')
export class TodosGatewayController {
  constructor(
    @Inject('TODO_SERVICE') private readonly todoClient: ClientProxy,
    @InjectQueue('email-queue') private readonly emailQueue: Queue,
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

  // =========================================================================
  // 📬 NEW CHAPTER: Persistent Message Queue (BullMQ) Producer
  // Pushes a durable job into Redis that SURVIVES worker restarts!
  // =========================================================================
  @Post('queue/email')
  async queueEmailTask(
    @Body() body: { to?: string; subject?: string; body?: string },
  ) {
    const jobData = {
      to: body?.to || 'student@example.com',
      subject: body?.subject || 'Welcome to Persistent Queues (BullMQ)',
      body: body?.body || 'This email job is safely persisted in Redis and cannot be lost!',
    };

    console.log('📬 [API Gateway] Pushing durable job to BullMQ "email-queue"...');
    const job = await this.emailQueue.add('send_welcome_email', jobData, {
      attempts: 3, // Auto-retry 3 times if failed!
      backoff: {
        type: 'exponential',
        delay: 2000, // 2s, then 4s, then 8s
      },
      removeOnComplete: false, // Keep in completed list so we can inspect it!
    });

    return {
      status: 'queued',
      message: 'Job persisted durably in Redis! Even if the worker is offline, it will process when restarted.',
      jobId: job.id,
      data: jobData,
    };
  }

  // =========================================================================
  // 🔍 NEW CHAPTER: Inspect Queue Status (Real-Time Job Counters)
  // Shows how many jobs are waiting, active, completed, or failed in Redis!
  // =========================================================================
  @Get('queue/status')
  async getQueueStatus() {
    const counts = await this.emailQueue.getJobCounts(
      'waiting',
      'active',
      'completed',
      'failed',
      'delayed',
    );
    return {
      queueName: 'email-queue',
      storage: 'Redis (127.0.0.1:6379)',
      jobCounts: counts,
    };
  }
}
