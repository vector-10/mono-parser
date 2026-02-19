import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class OutboundWebhookService {
  constructor(
    private prisma: PrismaService,
    private readonly logger: PinoLogger,
    @InjectQueue('webhooks') private readonly webhooksQueue: Queue,
  ) {
    this.logger.setContext(OutboundWebhookService.name);
  }

  async dispatch(fintechId: string, event: string, payload: any) {
    const fintech = await this.prisma.user.findUnique({
      where: { id: fintechId },
      select: { webhookUrl: true },
    });

    if (!fintech?.webhookUrl) {
      this.logger.info({ fintechId, event }, 'No webhook URL configured, skipping dispatch');
      return;
    }

    const delivery = await this.prisma.webhookDelivery.create({
      data: {
        fintechId,
        event,
        payload,
        webhookUrl: fintech.webhookUrl,
        status: 'PENDING',
      },
    });

    await this.webhooksQueue.add('deliver-webhook', { deliveryId: delivery.id });

    this.logger.info({ deliveryId: delivery.id, fintechId, event }, 'Webhook delivery queued');
  }
}
