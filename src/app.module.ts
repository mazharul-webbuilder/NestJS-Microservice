import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { TodosGatewayModule } from './gateway/todos-gateway.module.js';
import { LoggingMiddleware } from './common/middleware/logging.middleware.js';

@Module({
  imports: [TodosGatewayModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggingMiddleware)
      .forRoutes('{*path}');
  }
}
