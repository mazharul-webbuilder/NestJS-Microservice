import { Controller } from '@nestjs/common';
import { EventPattern, Payload, Ctx, RmqContext, Transport } from '@nestjs/microservices';

@Controller()
export class NotificationServiceController {
  // 1. Redis Pub/Sub: 'todo.created'
  @EventPattern('todo.created', Transport.REDIS)
  handleTodoCreated(@Payload() data: { id: number; title: string; completed: boolean }) {
    console.log('🔔 [Notification Microservice] ASYNC EVENT RECEIVED via Redis Pub/Sub!');
    console.log(`✉️  Sending simulated notification/email for Todo #${data.id}: "${data.title}"`);
  }

  // 2. 🐇 RabbitMQ: 'todo.updated' (With Manual ACK guarantee via RmqContext)
  @EventPattern('todo.updated', Transport.RMQ)
  handleTodoUpdated(@Payload() data: any, @Ctx() context: any) {
    console.log('🐇 [Notification Microservice] RECEIVED RabbitMQ Event from CloudAMQP:');
    console.log('📦 Data Payload:', JSON.stringify(data, null, 2));

    const rmqContext = context as RmqContext;
    const channel = rmqContext.getChannelRef();
    const originalMsg = rmqContext.getMessage();

    try {
      console.log(`✉️  Processing RabbitMQ notification for Todo #${data.todo?.id} updated at ${data.updatedAt}`);
      channel.ack(originalMsg);
      console.log('✅ [RabbitMQ ACK] Message acknowledged and safely removed from queue.');
    } catch (error) {
      console.error('❌ [RabbitMQ Error] Processing failed! Rejecting message...', error);
      channel.nack(originalMsg, false, false);
    }
  }

  // =========================================================================
  // 3. ⚡ Apache Kafka: 'todo.deleted' (Event Stream with Partitions & Offsets)
  // =========================================================================
  @EventPattern('todo.deleted', Transport.KAFKA)
  handleTodoDeleted(@Payload() data: any, @Ctx() context: any) {
    console.log('⚡ [Notification Microservice] RECEIVED KAFKA EVENT STREAM from Redpanda Cloud:');
    console.log('📦 Kafka Data Payload:', JSON.stringify(data, null, 2));

    try {
      const kafkaContext = context?.getContext?.();
      const topic = kafkaContext?.topic || 'todo.deleted';
      const partition = kafkaContext?.partition ?? 0;
      const offset = kafkaContext?.offset ?? 'unknown';

      console.log(`📍 [Kafka Stream Info] Topic: "${topic}" | Partition: #${partition} | Offset: @${offset}`);
      console.log(`🗑️  Audit/Analytics: Todo #${data?.value?.id || data?.id} was deleted by ${data?.value?.actor || 'USER'}`);
    } catch (err) {
      console.log('🗑️  Audit/Analytics: Processed Kafka delete event:', data);
    }
  }
}
