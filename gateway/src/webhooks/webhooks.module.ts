import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WebhooksController } from './webhooks.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { MonoWebhookService } from './webhook.service';
import { EventsModule } from 'src/events/events.module';

@Module({
  imports: [ConfigModule, EventsModule],
  controllers: [WebhooksController],
  providers: [PrismaService, MonoWebhookService],
})
export class WebhooksModule {}
