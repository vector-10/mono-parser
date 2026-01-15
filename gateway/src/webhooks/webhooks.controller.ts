import {
  Controller,
  Post,
  Body,
  Headers,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { MonoWebhookService } from './webhook.service';

@Controller('webhooks/mono')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(private readonly webhookService: MonoWebhookService) {}

  private get eventHandlers() {
    return {
      'mono.events.webhook_test': (data) => ({
        status: 'success',
        message: 'Test received',
      }),
      'mono.events.account_connected':
        this.webhookService.handleAccountLinked.bind(this.webhookService),
      'mono.events.account_reauthorised':
        this.webhookService.handleAccountReauthorised.bind(this.webhookService),
      'mono.events.account_income':
        this.webhookService.handleAccountIncome.bind(this.webhookService),
      'mono.events.statement_insights':
        this.webhookService.handleStatementInsights.bind(this.webhookService),
      'mono.events.account_credit_worthiness':
        this.webhookService.handleCreditWorthiness.bind(this.webhookService),
    };
  }

  @Post()
  async handleMonoWebhook(
    @Body() payload: any,
    @Headers('mono-webhook-secret') webhookSecret: string,
  ) {
    this.logger.log(`Webhook received: ${payload.event}`);

    if (!this.verifyWebhookSignature(payload, webhookSecret)) {
      this.logger.error('Invalid webhook signature');
      throw new BadRequestException('Invalid webhook signature');
    }

    const handler = this.eventHandlers[payload.event];
    if (!handler) {
      this.logger.warn(`No handler for event type: ${payload.event}`);
      return { status: 'ignored', event: payload.event };
    }

    try {
      return await handler(payload.data);
    } catch (error) {
      this.logger.error(`Handler failed: ${payload.event}`, error);
      throw error;
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
