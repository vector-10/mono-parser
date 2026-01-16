import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class MonoWebhookService {
  private readonly logger = new Logger(MonoWebhookService.name);

  constructor(private prisma: PrismaService) {}

  async handleAccountLinked(data: any) {
    const { account: monoAccountId, meta } = data;

    const applicantId = meta?.user_id;

    if (!applicantId || !monoAccountId) {
      this.logger.error(
        `Critical Webhook Error: Missing identifiers (Applicant: ${applicantId}, Account: ${monoAccountId})`,
      );
      return { status: 'ignored', reason: 'missing_identifiers' };
    }

    try {
      const bankAccount = await this.prisma.bankAccount.upsert({
        where: { monoAccountId },
        update: { updatedAt: new Date() },
        create: {
          monoAccountId,
          applicantId,
        },
      });

      this.logger.log(
        ` Successfully linked Bank ${monoAccountId} to Applicant ${applicantId}`,
      );
      return { status: 'success', accountId: bankAccount.id };
    } catch (error) {
      this.logger.error(`Failed to upsert bank account: ${error.message}`);
      return { status: 'error', reason: 'database_failure' };
    }
  }

  async handleAccountReauthorised(data: any) {
    const { account: monoAccountId } = data;
    await this.prisma.bankAccount.update({
      where: { monoAccountId },
      data: { updatedAt: new Date() },
    });
    this.logger.log(` Bank Account ${monoAccountId} reauthorised`);
    return { status: 'success' };
  }

  async handleAccountIncome(data: any) {
    const { account: monoAccountId } = data;

    this.logger.log(` Income data received for account ${monoAccountId}`);
    return { status: 'success' };
  }

  async handleStatementInsights(data: any) {
    const { account: monoAccountId } = data;

    this.logger.log(` Insights received for account ${monoAccountId}`);
    return { status: 'success' };
  }

  async handleCreditWorthiness(data: any) {
    const { account: monoAccountId, can_afford } = data;
    this.logger.log(
      ` Creditworthiness check: ${can_afford} for ${monoAccountId}`,
    );
    return { status: 'success' };
  }
}
