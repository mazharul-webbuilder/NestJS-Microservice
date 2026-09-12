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
}
