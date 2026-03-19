import { Processor, WorkerHost, InjectQueue } from '@nestjs/bullmq';
import { OnApplicationBootstrap } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import { Prisma } from '@prisma/client';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from 'src/prisma/prisma.service';
import { OutboundWebhookService } from './outbound-webhook.service';

const STUCK_THRESHOLD_MS = 20 * 60 * 1000;
const PENDING_LINKING_TIMEOUT_MS = 24 * 60 * 60 * 1000;
const LINKED_TIMEOUT_MS = 7 * 24 * 60 * 60 * 1000;

@Processor('enrichment-cleanup', { concurrency: 2 })
export class EnrichmentCleanupProcessor
  extends WorkerHost
  implements OnApplicationBootstrap
{
  constructor(
    private readonly prisma: PrismaService,
    private readonly outboundWebhookService: OutboundWebhookService,
    private readonly logger: PinoLogger,
    @InjectQueue('enrichment-cleanup') private readonly cleanupQueue: Queue,
  ) {
    super();
    this.logger.setContext(EnrichmentCleanupProcessor.name);
  }

  async onApplicationBootstrap() {
    await this.cleanupQueue.add(
      'scan-stuck-enrichments',
      {},
      {
        repeat: { every: 15 * 60 * 1000 },
        jobId: 'enrichment-cleanup-repeatable',
      },
    );
    this.logger.info('Enrichment cleanup job scheduled (every 15 minutes)');
  }

  async process(_job: Job): Promise<void> {
    await this.cleanStuckEnrichments();
    await this.abandonPendingLinking();
    await this.abandonLinked();
  }

  private async cleanStuckEnrichments(): Promise<void> {
    const cutoff = new Date(Date.now() - STUCK_THRESHOLD_MS);

    const stuckAccounts = await this.prisma.bankAccount.findMany({
      where: { enrichmentStatus: 'PENDING', updatedAt: { lt: cutoff } },
      include: { applicant: true },
    });

    if (!stuckAccounts.length) {
      this.logger.info('Enrichment cleanup: no stuck accounts found');
      return;
    }

    this.logger.warn(
      { count: stuckAccounts.length },
      'Enrichment cleanup: found stuck accounts, marking FAILED',
    );

    for (const account of stuckAccounts) {
      try {
        await this.prisma.bankAccount.update({
          where: { id: account.id },
          data: { enrichmentStatus: 'FAILED' },
        });

        await this.outboundWebhookService.dispatch(
          account.applicant.fintechId,
          'account.enrichment_failed',
          {
            accountId: account.id,
            monoAccountId: account.monoAccountId,
            applicantId: account.applicantId,
            reason: 'enrichment_timeout',
            message:
              'Account enrichment did not complete within the expected window. ' +
              'Ask the applicant to re-link their bank account to restart the process.',
          },
        );

        this.logger.warn(
          { accountId: account.id, monoAccountId: account.monoAccountId },
          'Account marked FAILED and fintech notified',
        );
      } catch (err) {
        this.logger.error(
          { err, accountId: account.id },
          'Failed to process stuck account during cleanup',
        );
      }
    }
  }

  private async abandonPendingLinking(): Promise<void> {
    const cutoff = new Date(Date.now() - PENDING_LINKING_TIMEOUT_MS);

    const stale = await this.prisma.application.findMany({
      where: { status: 'PENDING_LINKING', createdAt: { lt: cutoff } },
      include: { applicant: true },
    });

    if (!stale.length) {
      this.logger.info(
        'Abandoned cleanup: no stale PENDING_LINKING applications',
      );
      return;
    }

    this.logger.warn(
      { count: stale.length },
      'Abandoning PENDING_LINKING applications',
    );

    for (const application of stale) {
      try {
        await this.prisma.application.update({
          where: { id: application.id },
          data: { status: 'ABANDONED', abandonedAt: new Date() },
        });

        await this.outboundWebhookService.dispatch(
          application.applicant.fintechId,
          'application.abandoned',
          {
            applicationId: application.id,
            applicantId: application.applicantId,
            reason: 'no_link',
            message:
              'Application abandoned — applicant did not link a bank account within 24 hours. ' +
              'Re-initiate using the same idempotency key to resume.',
          },
        );

        this.logger.warn(
          { applicationId: application.id },
          'Application abandoned (no_link)',
        );
      } catch (err) {
        this.logger.error(
          { err, applicationId: application.id },
          'Failed to abandon application (no_link)',
        );
      }
    }
  }

  private async abandonLinked(): Promise<void> {
    const cutoff = new Date(Date.now() - LINKED_TIMEOUT_MS);

    const stale = await this.prisma.application.findMany({
      where: { status: 'LINKED', updatedAt: { lt: cutoff } },
      include: {
        applicant: {
          include: {
            bankAccounts: true,
            applications: {
              where: {
                status: { in: ['PENDING_LINKING', 'LINKED', 'PROCESSING'] },
              },
            },
          },
        },
      },
    });

    if (!stale.length) {
      this.logger.info('Abandoned cleanup: no stale LINKED applications');
      return;
    }

    this.logger.warn({ count: stale.length }, 'Abandoning LINKED applications');

    for (const application of stale) {
      try {
        await this.prisma.application.update({
          where: { id: application.id },
          data: { status: 'ABANDONED', abandonedAt: new Date() },
        });

        const hasOtherActive = application.applicant.applications.some(
          (a) => a.id !== application.id,
        );

        if (!hasOtherActive) {
          const accountIds = application.applicant.bankAccounts.map(
            (a) => a.id,
          );

          if (accountIds.length) {
            await this.prisma.bankAccount.updateMany({
              where: { id: { in: accountIds }, enrichmentStatus: 'READY' },
              data: {
                accountDetailsData: Prisma.DbNull,
                balanceData: Prisma.DbNull,
                transactionsData: Prisma.DbNull,
                identityData: Prisma.DbNull,
                incomeData: Prisma.DbNull,
                statementInsightsData: Prisma.DbNull,
                enrichmentStatus: 'SCRUBBED',
              },
            });

            this.logger.info(
              { applicationId: application.id },
              'Bank data scrubbed',
            );
          }
        } else {
          this.logger.info(
            { applicationId: application.id },
            'Skipped scrub — applicant has other active applications',
          );
        }

        await this.outboundWebhookService.dispatch(
          application.applicant.fintechId,
          'application.abandoned',
          {
            applicationId: application.id,
            applicantId: application.applicantId,
            reason: 'no_analyze',
            message:
              'Application abandoned — analysis was not submitted within 7 days of account linking. ' +
              'Bank data has been scrubbed. Re-initiate using the same idempotency key to resume.',
          },
        );

        this.logger.warn(
          { applicationId: application.id },
          'Application abandoned (no_analyze)',
        );
      } catch (err) {
        this.logger.error(
          { err, applicationId: application.id },
          'Failed to abandon application (no_analyze)',
        );
      }
    }
  }
}
