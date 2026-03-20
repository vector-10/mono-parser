import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WebhooksController } from './webhooks.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { MonoWebhookService } from './webhook.service';
import { QueueModule } from 'src/queues/queue.module';
import { MonoModule } from 'src/mono/mono.module';

@Module({
  imports: [ConfigModule, QueueModule, MonoModule],
  controllers: [WebhooksController],
  providers: [PrismaService, MonoWebhookService],
})
export class WebhooksModule {}
