import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Job } from 'bullmq';
import { createHmac } from 'crypto';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from 'src/prisma/prisma.service';

@Processor('webhooks', { concurrency: 10 })
@Injectable()
export class WebhookDeliveryProcessor extends WorkerHost {
  constructor(
    private prisma: PrismaService,
    private readonly logger: PinoLogger,
  ) {
    super();
    this.logger.setContext(WebhookDeliveryProcessor.name);
  }

  async process(job: Job) {
    const { deliveryId } = job.data;

    const delivery = await this.prisma.webhookDelivery.findUnique({
      where: { id: deliveryId },
    });

    if (!delivery) {
      this.logger.warn({ deliveryId }, 'Webhook delivery record not found');
      return;
    }

    const fintech = await this.prisma.user.findUnique({
      where: { id: delivery.fintechId },
      select: { apiKey: true },
    });

    if (!fintech) {
      this.logger.warn({ deliveryId, fintechId: delivery.fintechId }, 'Fintech not found');
      return;
    }

    const body = JSON.stringify({
      event: delivery.event,
      data: delivery.payload,
      timestamp: new Date().toISOString(),
    });

    const signature = createHmac('sha256', fintech.apiKey).update(body).digest('hex');

    try {
      const response = await fetch(delivery.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-signature': signature,
        },
        body,
      });

      await this.prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          status: response.ok ? 'DELIVERED' : 'FAILED',
          statusCode: response.status,
          attempts: { increment: 1 },
          lastAttemptAt: new Date(),
          errorMessage: response.ok ? null : `HTTP ${response.status}`,
        },
      });

      if (!response.ok) {
        this.logger.warn(
          { deliveryId, statusCode: response.status, attempt: job.attemptsMade + 1 },
          'Webhook delivery failed, will retry',
        );
        throw new Error(`HTTP ${response.status}`);
      }

      this.logger.info({ deliveryId, fintechId: delivery.fintechId }, 'Webhook delivered');
    } catch (error) {
      await this.prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          status: 'FAILED',
          attempts: { increment: 1 },
          lastAttemptAt: new Date(),
          errorMessage: error.message,
        },
      });
      throw error;
    }
  }
}
