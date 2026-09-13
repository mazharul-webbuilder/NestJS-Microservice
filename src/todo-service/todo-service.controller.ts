import { Controller, Inject } from '@nestjs/common';
import { MessagePattern, Payload, ClientProxy, RpcException } from '@nestjs/microservices';
import { CreateTodoDto } from '../common/dto/create-todo.dto.js';

export interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

@Controller()
export class TodoServiceController {
  constructor(
    @Inject('REDIS_SERVICE') private readonly redisClient: ClientProxy,
    @Inject('RABBITMQ_SERVICE') private readonly rabbitClient: ClientProxy,
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientProxy,
  ) {}

  // In-memory data store for this microservice (isolated DB simulation)
  private todos: Todo[] = [
    { id: 1, title: 'Learn Microservices Architecture', completed: false },
    { id: 2, title: 'Understand Synchronous TCP', completed: true },
  ];

  @MessagePattern({ cmd: 'get_todos' })
  getTodos(): Todo[] {
    console.log('📥 [Todo Microservice] Received TCP message: get_todos');
    return this.todos;
  }

  // 🐢 Simulated Slow RPC: Demonstrates how timeouts catch lagging services
  @MessagePattern({ cmd: 'get_todos_slow' })
  async getTodosSlow(): Promise<Todo[]> {
    console.log('⏳ [Todo Microservice] Received get_todos_slow. Simulating 5-second delay...');
    await new Promise((resolve) => setTimeout(resolve, 5000));
    return this.todos;
  }

  // 🎯 RPC Error Handling: Demonstrates throwing RpcException across TCP
  @MessagePattern({ cmd: 'get_todo_by_id' })
  getTodoById(@Payload() id: number): Todo {
    console.log(`📥 [Todo Microservice] Received TCP message: get_todo_by_id for ID: ${id}`);
    const todo = this.todos.find((t) => t.id === Number(id));
    if (!todo) {
      throw new RpcException({
        statusCode: 404,
        message: `Todo with ID #${id} not found in Todo Microservice`,
      });
    }
    return todo;
  }

  @MessagePattern({ cmd: 'create_todo' })
  createTodo(@Payload() data: CreateTodoDto): Todo {
    console.log('📥 [Todo Microservice] Received TCP message: create_todo with data:', data);
    const newTodo: Todo = {
      id: this.todos.length + 1,
      title: data.title,
      completed: false,
    };
    this.todos.push(newTodo);

    // 🔥 ASYNCHRONOUS EVENT (FIRE-AND-FORGET)
    // We emit to Redis Pub/Sub without awaiting. We don't block the caller!
    console.log('📤 [Todo Microservice] Emitting async event "todo.created" to Redis...');
    this.redisClient.emit('todo.created', newTodo);

    return newTodo;
  }

  // =========================================================================
  // 🐇 NEW CHAPTER: Update Todo & Publish Event to Cloud RabbitMQ
  // =========================================================================
  @MessagePattern({ cmd: 'update_todo' })
  updateTodo(@Payload() payload: { id: number; title?: string; completed?: boolean }): Todo {
    console.log(`📥 [Todo Microservice] Received TCP message: update_todo for ID: ${payload.id}`);
    const todo = this.todos.find((t) => t.id === Number(payload.id));
    if (!todo) {
      throw new RpcException({
        statusCode: 404,
        message: `Todo with ID #${payload.id} not found to update`,
      });
    }

    if (payload.title !== undefined) todo.title = payload.title;
    if (payload.completed !== undefined) todo.completed = payload.completed;

    // 🐇 Emit event to RabbitMQ (CloudAMQP)
    console.log('📤 [Todo Microservice] Publishing "todo.updated" event to RabbitMQ...');
    this.rabbitClient.emit('todo.updated', {
      todo,
      updatedAt: new Date().toISOString(),
      action: 'UPDATE',
    });

    return todo;
  }

  // =========================================================================
  // ⚡ NEW CHAPTER: Delete Todo & Stream Event to Apache Kafka (Redpanda)
  // =========================================================================
  @MessagePattern({ cmd: 'delete_todo' })
  deleteTodo(@Payload() id: number): { success: boolean; deletedTodo: Todo } {
    console.log(`📥 [Todo Microservice] Received TCP message: delete_todo for ID: ${id}`);
    const index = this.todos.findIndex((t) => t.id === Number(id));
    if (index === -1) {
      throw new RpcException({
        statusCode: 404,
        message: `Todo with ID #${id} not found to delete`,
      });
    }

    const deleted = this.todos.splice(index, 1)[0];

    // ⚡ Stream Event to Kafka Topic: 'todo.deleted'
    console.log('📤 [Todo Microservice] Streaming "todo.deleted" event to Apache Kafka cluster...');
    this.kafkaClient.emit('todo.deleted', {
      key: String(deleted.id), // Kafka Partition Key (guarantees same ID goes to same partition!)
      value: {
        id: deleted.id,
        title: deleted.title,
        deletedAt: new Date().toISOString(),
        actor: 'ADMIN_USER',
      },
    });

    return { success: true, deletedTodo: deleted };
  }
}
