import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

export interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

@Controller()
export class TodoServiceController {
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

  @MessagePattern({ cmd: 'create_todo' })
  createTodo(@Payload() data: { title: string }): Todo {
    console.log('📥 [Todo Microservice] Received TCP message: create_todo with data:', data);
    const newTodo: Todo = {
      id: this.todos.length + 1,
      title: data.title,
      completed: false,
    };
    this.todos.push(newTodo);
    return newTodo;
  }
}
