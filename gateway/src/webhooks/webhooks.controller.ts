import { Controller, Post, Body, Headers, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';


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

  private readonly eventHandlers = {
    'mono.events.webhook_test': this.handleWebhookTest.bind(this),
    'mono.events.account_connected': this.handleAccountLinked.bind(this),
    'mono.events.account_reauthorised': this.handleAccountReauthorised.bind(this),
    'mono.events.account_updated': this.handleAccountUpdated.bind(this),
    'mono.events.account_income': this.handleAccountIncome.bind(this),
    'mono.events.statement_insights': this.handleStatementInsights.bind(this),
    'mono.events.account_credit_worthiness': this.handleCreditWorthiness.bind(this),
  }

  constructor(private prisma: PrismaService) {}

  @Post()
  async handleMonoWebhook(
    @Body() payload: any,
    @Headers('mono-webhook-secret') webhookSecret: string,
  ) {
    this.logger.log(`Webhook received: ${payload.event}`);

    if(!this.verifyWebhookSignature(payload, webhookSecret)) {
        this.logger.error('Invalid webhook signature');
        throw new BadRequestException('Invalid webhook signature');
    }

    const handler = this.eventHandlers[payload.event];
    if(!handler) {
        this.logger.warn(`No handler for event type: ${payload.event}`);
        return { status: 'ignored', event: payload.event }
    }

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
    return { status: 'success', message: 'Webhook test received successfully' };
  }

  private async handleAccountLinked(data: any) {
    const { account: monoAccountId, customer: customerId, meta } = data;
    const userId = meta?.user_id;

    if (!userId || !monoAccountId) {
      this.logger.error(`Critical Webhook Error: Missing data (User: ${userId}, Account: ${monoAccountId})`);
      return { status: 'ignored', reason: 'missing_identifiers' };  
    }

    const bankAccount = await this.prisma.bankAccount.upsert({
      where: { monoAccountId: monoAccountId },
      update: { updatedAt: new Date() },
      create: {
        monoAccountId: monoAccountId,
        userId: userId,
      }
    });

     await this.prisma.user.update({
      where: { id: userId },
      data: { monoCustomerId: customerId },
    });

    this.logger.log(` Successfully linked ${bankAccount.monoAccountId} to User ${userId}`);
    return { status: 'success', accountId: bankAccount.id };
  }

  private async handleAccountReauthorised(data: any) {
    const { account: monoAccountId } = data;
    await this.prisma.bankAccount.update({
        where: { monoAccountId: monoAccountId },
        data: { updatedAt: new Date() },
    });
    this.logger.log(` Bank Account ${monoAccountId} reauthorised`);
    return { status: 'success' };
  }

  private async handleAccountIncome(data: any) {
    const { account: monoAccountId, income } = data;
    // Logic to save income data to your database (e.g., a new Income model)
    this.logger.log(` Income data received for account ${monoAccountId}`);
    return { status: 'success' };
  }

  private async handleStatementInsights(data: any) {
    const { account: monoAccountId, insights } = data;
    // Logic to save insights (debt ratio, gambling, etc)
    this.logger.log(` Insights received for account ${monoAccountId}`);
    return { status: 'success' };
  }

  private async handleCreditWorthiness(data: any) {
    const { account: monoAccountId, score, can_afford } = data;
    // Logic to update your Application model with the verdict
    this.logger.log(` Creditworthiness check: ${can_afford} for ${monoAccountId}`);
    return { status: 'success' };
  }

  private async handleAccountUpdated(data: any) {
    this.logger.log(`Account ${data.account} updated - no action needed`);
    return { status: 'acknowledged' }
  }
}