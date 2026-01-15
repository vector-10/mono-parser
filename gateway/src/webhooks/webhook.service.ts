import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class MonoWebhookService {
  private readonly logger = new Logger(MonoWebhookService.name);

  constructor(private prisma: PrismaService) {}

  async handleAccountLinked(data: any) {
    const { account: monoAccountId, customer: customerId, meta } = data;
    const userId = meta?.user_id;

    if (!userId || !monoAccountId) {
      this.logger.error(`Critical Webhook Error: Missing data (User: ${userId}, Account: ${monoAccountId})`);
      return { status: 'ignored', reason: 'missing_identifiers' };
    }

    const bankAccount = await this.prisma.bankAccount.upsert({
      where: { monoAccountId },
      update: { updatedAt: new Date() },
      create: {
        monoAccountId,
        userId,
      },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { monoCustomerId: customerId },
    });

    this.logger.log(`✅ Successfully linked ${monoAccountId} to User ${userId}`);
    return { status: 'success', accountId: bankAccount.id };
  }

  async handleAccountReauthorised(data: any) {
    const { account: monoAccountId } = data;
    await this.prisma.bankAccount.update({
      where: { monoAccountId },
      data: { updatedAt: new Date() },
    });
    this.logger.log(`🔄 Bank Account ${monoAccountId} reauthorised`);
    return { status: 'success' };
  }

  async handleAccountIncome(data: any) {
    const { account: monoAccountId } = data;
    this.logger.log(`💰 Income data received for account ${monoAccountId}`);
    return { status: 'success' };
  }

  async handleStatementInsights(data: any) {
    const { account: monoAccountId } = data;
    this.logger.log(`📊 Insights received for account ${monoAccountId}`);
    return { status: 'success' };
  }

  async handleCreditWorthiness(data: any) {
    const { account: monoAccountId, can_afford } = data;
    this.logger.log(`⚖️ Creditworthiness check: ${can_afford} for ${monoAccountId}`);
    return { status: 'success' };
  }
}