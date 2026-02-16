import { Controller, Get } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Controller('queues')
export class QueueController {
  constructor(
    @InjectQueue('applications') private readonly applicationsQueue: Queue,
  ) {}

  @Get('test-redis')
  async testRedis() {
    try {
      const client = await this.applicationsQueue.client;
      const ping = await client.ping();
      return { success: true, ping };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
