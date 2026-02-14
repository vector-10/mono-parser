import {
  Controller,
  Post,
  Body,
  Headers,
  BadRequestException,
} from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { MonoWebhookService } from './webhook.service';

@Controller('webhooks/mono')
export class WebhooksController {
  constructor(
    private readonly webhookService: MonoWebhookService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(WebhooksController.name);
  }

  private get eventHandlers() {
    return {
      'mono.events.webhook_test': (data) => ({
        status: 'success',
        message: 'Test received',
      }),
      'mono.events.account_connected':
        this.webhookService.handleAccountLinked.bind(this.webhookService),
      'mono.events.account_updated':
        this.webhookService.handleAccountLinked.bind(this.webhookService),
      'mono.events.account_reauthorised':
        this.webhookService.handleAccountReauthorised.bind(this.webhookService),
    };
  }

  @Post()
  async handleMonoWebhook(
    @Body() payload: any,
    @Headers('mono-webhook-secret') webhookSecret: string,
    @Headers() allHeaders: any,
  ) {
    this.logger.info(
      {
        payload,
        webhookSecret,
        allHeaders,
        timestamp: new Date().toISOString(),
      },
      ' RAW WEBHOOK RECEIVED FROM MONO',
    );
    this.logger.info({ event: payload.event }, `Webhook received:`);

    if (!this.verifyWebhookSignature(payload, webhookSecret)) {
      this.logger.error(
        { webhookSecret, event: payload.event },
        'Invalid webhook signature',
      );
      throw new BadRequestException('Invalid webhook signature');
    }

    const handler = this.eventHandlers[payload.event];
    if (!handler) {
      this.logger.warn({ event: payload.event }, 'No handler for event type');
      return { status: 'ignored' };
    }

    try {
      const result = await handler(payload.data);
      return { status: 'received', result };
    } catch (error) {
      this.logger.error({ err: error, event: payload.event }, 'Handler failed');
      return { status: 'error', message: error.message };
    }
  }

  private verifyWebhookSignature(
    payload: any,
    receivedSecret: string,
  ): boolean {
    const expectedSecret = process.env.MONO_WEBHOOK_SECRET;
    if (!expectedSecret) {
      this.logger.warn(
        'MONO_WEBHOOK_SECRET not configured - skipping verification',
      );
      return true;
    }
    return receivedSecret === expectedSecret;
  }
}
