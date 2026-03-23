import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { PinoLogger } from 'nestjs-pino';
import { OutboundWebhookService } from 'src/queues/outbound-webhook.service';
import { MonoService } from 'src/mono/mono.service';

@Injectable()
export class MonoWebhookService {
  constructor(
    private prisma: PrismaService,
    private readonly logger: PinoLogger,
    private readonly outboundWebhookService: OutboundWebhookService,
    private readonly monoService: MonoService,
    @InjectQueue('enrichments') private readonly enrichmentsQueue: Queue,
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

    try {
      const existingAccount = await this.prisma.bankAccount.findUnique({
        where: { monoAccountId },
        include: { applicant: { include: { fintech: true } } },
      });

      if (existingAccount) {
        const secondsSinceUpdate =
          (Date.now() - existingAccount.updatedAt.getTime()) / 1000;

        if (existingAccount.enrichmentStatus === 'PENDING' && secondsSinceUpdate < 120) {
          this.logger.warn(
            { monoAccountId, secondsSinceUpdate },
            'Duplicate account_connected webhook detected — skipping reset',
          );
          return { status: 'success', accountId: existingAccount.id, linked: false, duplicate: true };
        }

        const updated = await this.prisma.bankAccount.update({
          where: { monoAccountId },
          data: {
            updatedAt:             new Date(),
            accountName:           accountData?.name,
            accountNumber:         accountData?.accountNumber,
            balance:               accountData?.balance,
            institution:           accountData?.institution?.name,
            enrichmentStatus:      'PENDING',
            accountDetailsData:    Prisma.DbNull,
            balanceData:           Prisma.DbNull,
            transactionsData:      Prisma.DbNull,
            identityData:          Prisma.DbNull,
            incomeData:            Prisma.DbNull,
            statementInsightsData: Prisma.DbNull,
            insightsJobId:         null,
          },
        });

        this.logger.info({ monoAccountId, applicantId }, 'Bank account refreshed');

        if (applicationId) {
          await this.prisma.application.update({
            where: { id: applicationId },
            data: {
              status:         'LINKED',
              bankAccountIds: { push: updated.id },
            },
          });

          await this.outboundWebhookService.dispatch(
            existingAccount.applicant.fintechId,
            'account.linked',
            {
              applicationId,
              applicantId,
              accountId:     updated.id,
              institution:   updated.institution,
              accountNumber: updated.accountNumber,
            },
          );
        }

        if (existingAccount.applicant.fintech.monoApiKey) {
          this._triggerEnrichments(
            updated.id,
            monoAccountId,
            existingAccount.applicant.fintech.monoApiKey,
            applicationId ?? undefined,
          ).catch((err) =>
            this.logger.error({ err, monoAccountId }, 'Enrichment trigger failed after re-link'),
          );
        }

        return { status: 'success', accountId: updated.id, linked: false };
      }

      const bankAccount = await this.prisma.bankAccount.create({
        data: {
          monoAccountId,
          applicantId,
          accountName:   accountData?.name,
          accountNumber: accountData?.accountNumber,
          balance:       accountData?.balance,
          institution:   accountData?.institution?.name,
        },
        include: { applicant: { include: { fintech: true } } },
      });

      this.logger.info({ monoAccountId, applicantId }, 'New bank account linked');

      if (applicationId) {
        await this.prisma.application.update({
          where: { id: applicationId },
          data: {
            status:         'LINKED',
            bankAccountIds: { push: bankAccount.id },
          },
        });

        await this.outboundWebhookService.dispatch(
          bankAccount.applicant.fintechId,
          'account.linked',
          {
            applicationId,
            applicantId,
            accountId:     bankAccount.id,
            institution:   bankAccount.institution,
            accountNumber: bankAccount.accountNumber,
          },
        );
      }

      if (bankAccount.applicant.fintech.monoApiKey) {
        this._triggerEnrichments(
          bankAccount.id,
          monoAccountId,
          bankAccount.applicant.fintech.monoApiKey,
          applicationId ?? undefined,
        ).catch((err) =>
          this.logger.error({ err, monoAccountId }, 'Enrichment trigger failed after new link'),
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
    const monoAccountId = data.account?._id ?? data.account;

    this.logger.info({ monoAccountId }, 'Income webhook received');

    const incomeData = data.income ?? data;

    if (!monoAccountId) {
      this.logger.warn({ payload: data }, 'Income webhook missing account ID');
      return;
    }

    try {
      await this.prisma.bankAccount.update({
        where: { monoAccountId },
        data: { incomeData },
      });

      this.logger.info({ monoAccountId }, 'Income data stored');

      await this._checkAndFireEnrichmentReady(monoAccountId);
    } catch (error) {
      this.logger.error(
        { err: error, monoAccountId },
        'Failed to store income data from webhook',
      );
    }
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

  private async _triggerEnrichments(
    bankAccountId: string,
    monoAccountId: string,
    monoApiKey: string,
    applicationId?: string,
  ): Promise<void> {
    this.logger.info({ monoAccountId, applicationId }, 'Triggering enrichments and pre-fetch');

    const [accountDetails, balance, transactions, identity] = await Promise.allSettled([
      this.monoService.getAccountDetails(monoAccountId, monoApiKey),
      this.monoService.getAccountBalance(monoAccountId, monoApiKey),
      this.monoService.getTransactions(monoAccountId, monoApiKey),
      this.monoService.getIdentity(monoAccountId, monoApiKey),
    ]);

    (
      [
        ['accountDetails', accountDetails],
        ['balance',        balance],
        ['transactions',   transactions],
        ['identity',       identity],
      ] as [string, PromiseSettledResult<any>][]
    ).forEach(([name, result]) => {
      if (result.status === 'rejected') {
        this.logger.warn({ err: result.reason, monoAccountId, endpoint: name }, `Pre-fetch failed for ${name}`);
      }
    });

    await this.prisma.bankAccount.update({
      where: { id: bankAccountId },
      data: {
        accountDetailsData: accountDetails.status === 'fulfilled' ? accountDetails.value : Prisma.DbNull,
        balanceData:        balance.status      === 'fulfilled'   ? balance.value        : Prisma.DbNull,
        transactionsData:   transactions.status === 'fulfilled'   ? transactions.value   : Prisma.DbNull,
        identityData:       identity.status     === 'fulfilled'   ? identity.value       : Prisma.DbNull,
        syncDataFetchedAt:  new Date(),
      },
    });

    this.logger.info({ monoAccountId }, 'Sync pre-fetch complete');

    try {
      await this.monoService.getIncome(monoAccountId, monoApiKey);
      this.logger.info({ monoAccountId }, 'Income analysis triggered');
    } catch (err) {
      this.logger.warn({ err, monoAccountId }, 'Income trigger failed — will rely on webhook');
    }

    try {
      const jobId = await this.monoService.triggerStatementInsightsJob(
        monoAccountId,
        monoApiKey,
      );

      await this.prisma.bankAccount.update({
        where: { id: bankAccountId },
        data: { insightsJobId: jobId },
      });

      await this.enrichmentsQueue.add(
        'poll-insights',
        { bankAccountId, monoAccountId, jobId, monoApiKey, pollAttempt: 0, applicationId },
        { delay: 30_000 },
      );

      this.logger.info({ monoAccountId, jobId }, 'Statement insights job started, poll scheduled');
    } catch (err) {
      this.logger.error({ err, monoAccountId }, 'Failed to trigger statement insights job');
    }
  }

  async _checkAndFireEnrichmentReady(monoAccountId: string): Promise<void> {
    const result = await this.prisma.bankAccount.updateMany({
      where: {
        monoAccountId,
        enrichmentStatus: { not: 'READY' },
        incomeData: { not: Prisma.AnyNull },
        statementInsightsData: { not: Prisma.AnyNull },
      },
      data: { enrichmentStatus: 'READY' },
    });

    if (result.count === 0) {
      return;
    }

    const account = await this.prisma.bankAccount.findUnique({
      where: { monoAccountId },
      include: {
        applicant: {
          include: {
            applications: {
              where: { status: 'LINKED' },
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    if (!account) return;

    const applicationId = account.applicant.applications[0]?.id ?? null;

    this.logger.info({ monoAccountId, accountId: account.id, applicationId }, 'Both enrichments ready');

    await this.outboundWebhookService.dispatch(
      account.applicant.fintechId,
      'account.enrichment_ready',
      {
        accountId:     account.id,
        monoAccountId,
        applicantId:   account.applicantId,
        applicationId,
        message:       'Account enrichment complete.',
      },
    );

    await this._checkAndFireApplicationReady(account.id, account.applicant.fintechId);
  }

  private async _checkAndFireApplicationReady(
    bankAccountId: string,
    fintechId: string,
  ): Promise<void> {
    const applications = await this.prisma.application.findMany({
      where: {
        bankAccountIds: { has: bankAccountId },
        linkingFinalized: true,
        status: 'LINKED',
      },
    });

    for (const app of applications) {
      const accounts = await this.prisma.bankAccount.findMany({
        where: { id: { in: app.bankAccountIds } },
        select: { enrichmentStatus: true },
      });

      const allReady =
        accounts.length > 0 && accounts.every((a) => a.enrichmentStatus === 'READY');

      if (allReady) {
        await this.outboundWebhookService.dispatch(fintechId, 'application.ready_for_analysis', {
          applicationId: app.id,
          applicantId:   app.applicantId,
          accountCount:  app.bankAccountIds.length,
          message:       'All accounts are enriched. You may now submit for analysis.',
        });

        this.logger.info({ applicationId: app.id }, 'application.ready_for_analysis fired');
      }
    }
  }
}
