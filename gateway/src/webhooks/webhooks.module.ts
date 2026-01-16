import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { MonoWebhookService } from './webhook.service';

@Module({
  controllers: [WebhooksController],
  providers: [PrismaService, MonoWebhookService],
})
export class WebhooksModule {}
