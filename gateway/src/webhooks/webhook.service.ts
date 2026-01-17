import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class MonoWebhookService {
  private readonly logger = new Logger(MonoWebhookService.name);

  constructor(private prisma: PrismaService) {}

  async handleAccountLinked(data: any) {
    this.logger.log(`Full payload received: ${JSON.stringify(data, null, 2)}`);
    const accountData = data.account;
    const monoAccountId = accountData?._id || data.id;
    const applicantId = data.meta?.user_id;

    this.logger.log(
      `Parsed - Account ID: ${monoAccountId}, Applicant ID: ${applicantId}`,
    );

    if (!applicantId) {
      this.logger.log(
        `Account ${monoAccountId} connected, waiting for full data...`,
      );
      return {
        status: 'acknowledged',
        message: 'Waiting for account_updated event',
      };
    }

    if (!monoAccountId) {
      this.logger.error(`Missing account ID in webhook`);
      return { status: 'error', reason: 'missing_account_id' };
    }

    try {
      const bankAccount = await this.prisma.bankAccount.upsert({
        where: { monoAccountId },
        update: {
          updatedAt: new Date(),
          accountName: accountData?.name,
          accountNumber: accountData?.accountNumber,
          balance: accountData?.balance,
          institution: accountData?.institution?.name,
        },
        create: {
          monoAccountId,
          applicantId,
          accountName: accountData?.name,
          accountNumber: accountData?.accountNumber,
          balance: accountData?.balance,
          institution: accountData?.institution?.name,
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
