import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

export interface EmailJobData {
  to: string;
  subject: string;
  body: string;
}

// 📬 WORKER CONSUMER: Listens to the persistent 'email-queue' in Redis
@Processor('email-queue')
export class EmailConsumer extends WorkerHost {
  async process(job: Job<EmailJobData, any, string>): Promise<{ delivered: boolean }> {
    console.log(`\n📬 [BullMQ Worker] ========================================`);
    console.log(`📥 [BullMQ Worker] PICKED UP JOB #${job.id}: "${job.name}"`);
    console.log(`✉️  Sending email to: ${job.data.to}`);
    console.log(`📝 Subject: "${job.data.subject}"`);
    console.log(`⏳ Simulating email delivery time (1.5 seconds)...`);

    // Simulate work (e.g. SMTP / SendGrid API call)
    await new Promise((resolve) => setTimeout(resolve, 1500));

    console.log(`✅ [BullMQ Worker] JOB #${job.id} COMPLETED! Acknowledgment (ACK) sent to Redis.`);
    console.log(`📬 [BullMQ Worker] ========================================\n`);

    return { delivered: true };
  }
}
