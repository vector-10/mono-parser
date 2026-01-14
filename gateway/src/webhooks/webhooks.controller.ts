import { Controller, Post, Body, Headers, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as crypto from 'crypto';

interface MonoWebhookPayload {
    event: string;
    data:{
        account: string;
        customer: string;
        meta?: {
            user_id?: string;
            ref?: string;
        };
    };
}

@Controller('webhooks/mono')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  private readonly eventHandlers ={
    'mono.events.webhook_test': this.handleWebhookTest.bind(this),
    'mono.events.account_connected': this.handleAccountLinked.bind(this),
    'mono.events.account_reauthorised': this.handleAccountReauthorised.bind(this),
    'mono.events.account_updated': this.handleAccountUpdated.bind(this),
  }

  constructor(private prisma: PrismaService) {}

  @Post()
  async handleMonoWebhook(
    @Body() payload: any,
    @Headers('mono-webhook-secret') webhookSecret: string,
  ) {
    // Phase 1: Log incoming webhook
    this.logger.log(`Webhook received: ${payload.event}`);

    // Phase 2: Verify Signature (security prevents webhook hijacking)
    if(!this.verifyWebhookSignature(payload, webhookSecret)) {
        this.logger.error('Invalid webhook signature');
        throw new BadRequestException('Invalid webhook signature');
    }

    //Phase 3: Route to appropriate handler
    const handler = this.eventHandlers[payload.event];
    if(!handler) {
        this.logger.warn(`No handler for event type: ${payload.event}`);
        return { status: 'ignored', event: payload.event }
    }

    //Execute handler
    try {
        const result = await handler(payload.data);
        this.logger.log(`Handler success: ${payload.event}`);
        return result;
    } catch (error) {
        this.logger.error(`handler failed: ${payload.event}`, error);
        throw error;
    }

  }

  private verifyWebhookSignature(payload: any, receivedSecret: string): boolean {
    const expectedSecret = process.env.MONO_WEBHOOK_SECRET;

    if (!expectedSecret) {
      this.logger.warn('MONO_WEBHOOK_SECRET not configured - skipping verification');
      return true; 
    }

    return receivedSecret === expectedSecret;
  }

  private async handleWebhookTest(data: any) {
    this.logger.log('Webhook test event received');
    return {
      status: 'success',
      message: 'Webhook test received successfully',
    };
  }

  private async handleAccountLinked(data: MonoWebhookPayload['data']) {
    const { account, customer, meta } = data;
    const userId = meta?.user_id;

    if (!userId) {
      throw new BadRequestException('Missing user_id in webhook meta');
    }

    if (!account) {
      throw new BadRequestException('Missing account ID in webhook data');
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        monoAccountId: account,
        monoCustomerId: customer,
      },
    });

    this.logger.log(`User ${userId} linked account ${account}`);

    return {
      status: 'success',
      message: 'Account linked successfully',
      userId: user.id,
    };
  }

  private async handleAccountReauthorised(data: any) {
    const { account } = data;

    if(!account) {
        throw new BadRequestException('Missing Account ID')
    }

    await this.prisma.user.update({
        where: { monoAccountId: account },
        data: { updatedAt: new Date() },
    });

    this.logger.log(`Account ${account} reauthorised`);
    return {
      status: 'success',
      message: 'Account reauthorised',
    };
  }

  private async handleAccountUpdated(data: MonoWebhookPayload['data']) {
    this.logger.log(`Account ${data.account} updated - no action needed`);
    return {
        status: 'acknowledged'
    }
  }
}
