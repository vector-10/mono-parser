import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WebhooksController } from './webhooks.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { MonoWebhookService } from './webhook.service';
import { EventsModule } from 'src/events/events.module';
import { QueueModule } from 'src/queues/queue.module';

@Module({
  imports: [ConfigModule, EventsModule, forwardRef(() => QueueModule)],
  controllers: [WebhooksController],
  providers: [PrismaService, MonoWebhookService],
})
export class WebhooksModule {}
