import { Controller } from '@nestjs/common';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';

@Controller()
export class NotificationServiceController {
  // 1. Redis Pub/Sub: 'todo.created' (Unacknowledged Fire-and-Forget)
  @EventPattern('todo.created')
  handleTodoCreated(@Payload() data: { id: number; title: string; completed: boolean }) {
    console.log('🔔 [Notification Microservice] ASYNC EVENT RECEIVED via Redis Pub/Sub!');
    console.log(`✉️  Sending simulated notification/email for Todo #${data.id}: "${data.title}"`);
  }

  // 2. 🐇 RabbitMQ: 'todo.updated' (With Manual ACK guarantee via RmqContext)
  @EventPattern('todo.updated')
  handleTodoUpdated(@Payload() data: any, @Ctx() context: any) {
    console.log('🐇 [Notification Microservice] RECEIVED RabbitMQ Event from CloudAMQP:');
    console.log('📦 Data Payload:', JSON.stringify(data, null, 2));

    const rmqContext = context as RmqContext;
    const channel = rmqContext.getChannelRef();
    const originalMsg = rmqContext.getMessage();

    try {
      // Simulate doing work (e.g. sending SMS, updating analytics, email)
      console.log(`✉️  Processing RabbitMQ notification for Todo #${data.todo?.id} updated at ${data.updatedAt}`);

      // 💡 MANUAL ACKNOWLEDGMENT:
      // Tell RabbitMQ "I processed this message successfully. Safe to delete from queue!"
      channel.ack(originalMsg);
      console.log('✅ [RabbitMQ ACK] Message acknowledged and safely removed from queue.');
    } catch (error) {
      console.error('❌ [RabbitMQ Error] Processing failed! Rejecting message...', error);
      // If failed: channel.nack(originalMsg, allUpTo, requeue)
      // requeue = false sends to Dead Letter Queue if configured!
      channel.nack(originalMsg, false, false);
    }
  }
}
