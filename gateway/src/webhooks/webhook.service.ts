import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PinoLogger } from 'nestjs-pino';
import { EventsGateway } from 'src/events/events.gateway';
import { OutboundWebhookService } from 'src/queues/outbound-webhook.service';

@Injectable()
export class MonoWebhookService {
  constructor(
    private prisma: PrismaService,
    private readonly logger: PinoLogger,
    private readonly eventsGateway: EventsGateway,
    private readonly outboundWebhookService: OutboundWebhookService,
  ) {
    this.logger.setContext(MonoWebhookService.name);
  }

  async handleAccountLinked(data: any) {
    this.logger.info({ payload: data }, 'Full payload received');

    const accountData = data.account;
    const monoAccountId = accountData?._id;
    const applicantId = data.meta?.user_id;
    const applicationId = data.meta?.application_id;

    if (!monoAccountId) {
      this.logger.error({ payload: data }, 'Missing account ID in webhook');
      return { status: 'error', reason: 'missing_account_id' };
    }

    if (!applicantId) {
      this.logger.info({ monoAccountId }, 'Account connected, waiting for full data');
      return { status: 'acknowledged', message: 'Waiting for account_updated event' };
    }

    this.logger.info({ monoAccountId, applicantId }, 'Parsed webhook data');

    try {
      const existingAccount = await this.prisma.bankAccount.findUnique({
        where: { monoAccountId },
      });

      if (existingAccount) {
        const updated = await this.prisma.bankAccount.update({
          where: { monoAccountId },
          data: {
            updatedAt: new Date(),
            accountName: accountData?.name,
            accountNumber: accountData?.accountNumber,
            balance: accountData?.balance,
            institution: accountData?.institution?.name,
          },
          include: { applicant: true },
        });

        this.logger.info({ monoAccountId, applicantId }, 'Bank account refreshed');

        if (applicationId) {
          await this.prisma.application.update({
            where: { id: applicationId },
            data: { status: 'LINKED' },
          });

          await this.outboundWebhookService.dispatch(
            updated.applicant.fintechId,
            'account.linked',
            {
              applicationId,
              applicantId,
              accountId: updated.id,
              institution: updated.institution,
              accountNumber: updated.accountNumber,
            },
          );
        }

        return { status: 'success', accountId: updated.id, linked: false };
      }

      const bankAccount = await this.prisma.bankAccount.create({
        data: {
          monoAccountId,
          applicantId,
          accountName: accountData?.name,
          accountNumber: accountData?.accountNumber,
          balance: accountData?.balance,
          institution: accountData?.institution?.name,
        },
        include: { applicant: true },
      });

      this.logger.info({ monoAccountId, applicantId }, 'New bank account linked successfully');

      if (applicationId) {
        await this.prisma.application.update({
          where: { id: applicationId },
          data: { status: 'LINKED' },
        });

        await this.outboundWebhookService.dispatch(
          bankAccount.applicant.fintechId,
          'account.linked',
          {
            applicationId,
            applicantId,
            accountId: bankAccount.id,
            institution: bankAccount.institution,
            accountNumber: bankAccount.accountNumber,
          },
        );
      }

      return { status: 'success', accountId: bankAccount.id, linked: true };
    } catch (error) {
      this.logger.error(
        { err: error, monoAccountId, applicantId },
        `Failed to link bank account: ${error.message}`,
      );
      return { status: 'error', reason: 'database_failure' };
    }
  }

  async handleAccountIncome(data: any) {
    this.logger.info({ payload: data }, 'Received account income event');
  }

  async handleAccountReauthorised(data: any) {
    const monoAccountId = data.account?._id;
    await this.prisma.bankAccount.update({
      where: { monoAccountId },
      data: { updatedAt: new Date() },
    });
    this.logger.info({ monoAccountId }, 'Bank account reauthorised');
    return { status: 'success' };
  }
}
