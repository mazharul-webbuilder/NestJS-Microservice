import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { TodosModule } from './todos/todos.module.js';
import { LoggingMiddleware } from './common/middleware/logging.middleware.js';

@Module({
  imports: [TodosModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggingMiddleware)
      .forRoutes('*');
  }
}
