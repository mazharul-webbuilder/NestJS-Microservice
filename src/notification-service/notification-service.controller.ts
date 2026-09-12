import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';

@Controller()
export class NotificationServiceController {
  // Notice: @EventPattern instead of @MessagePattern!
  // This does NOT return anything back to the caller. It's fire-and-forget.
  @EventPattern('todo.created')
  handleTodoCreated(@Payload() data: { id: number; title: string; completed: boolean }) {
    console.log('🔔 [Notification Microservice] ASYNC EVENT RECEIVED via Redis Pub/Sub!');
    console.log(`✉️  Sending simulated notification/email for Todo #${data.id}: "${data.title}"`);
  }
}
