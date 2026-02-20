import {
  Controller,
  Post,
  Body,
  Headers,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { MonoWebhookService } from './webhook.service';

@Controller('webhooks/mono')
export class WebhooksController {
  private readonly webhookSecret: string;

  constructor(
    private readonly webhookService: MonoWebhookService,
    private readonly logger: PinoLogger,
    configService: ConfigService,
  ) {
    this.logger.setContext(WebhooksController.name);

    const secret = configService.get<string>('MONO_WEBHOOK_SECRET');
    if (!secret) {
      throw new Error('MONO_WEBHOOK_SECRET environment variable is not set');
    }
    this.webhookSecret = secret;
  }

  private get eventHandlers() {
    return {
      'mono.events.webhook_test': (_data: any) => ({
        status: 'success',
        message: 'Test received',
      }),
      'mono.events.account_connected':
        this.webhookService.handleAccountLinked.bind(this.webhookService),
      'mono.events.account_updated':
        this.webhookService.handleAccountLinked.bind(this.webhookService),
      'mono.events.account_reauthorised':
        this.webhookService.handleAccountReauthorised.bind(this.webhookService),
      'mono.events.account_income':
        this.webhookService.handleAccountIncome.bind(this.webhookService),
    };
  }

  @Post()
  async handleMonoWebhook(
    @Body() payload: any,
    @Headers('mono-webhook-secret') webhookSecret: string,
  ) {
    this.logger.info({ event: payload.event }, 'Webhook received');

    if (!webhookSecret || webhookSecret !== this.webhookSecret) {
      this.logger.error({ event: payload.event }, 'Invalid webhook signature');
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
}
