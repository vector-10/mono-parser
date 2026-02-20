import { Processor, WorkerHost, InjectQueue } from '@nestjs/bullmq';
import { OnApplicationBootstrap } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from 'src/prisma/prisma.service';
import { OutboundWebhookService } from './outbound-webhook.service';

const STUCK_THRESHOLD_MS = 20 * 60 * 1000; // 20 minutes

@Processor('enrichment-cleanup')
export class EnrichmentCleanupProcessor extends WorkerHost implements OnApplicationBootstrap {
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
        repeat: { every: 15 * 60 * 1000 }, // every 15 minutes
        jobId: 'enrichment-cleanup-repeatable', // stable ID prevents duplicates on restart
      },
    );
    this.logger.info('Enrichment cleanup job scheduled (every 15 minutes)');
  }

  // ─── BullMQ entry point ───────────────────────────────────────────────────

  async process(_job: Job): Promise<void> {
    const cutoff = new Date(Date.now() - STUCK_THRESHOLD_MS);

    const stuckAccounts = await this.prisma.bankAccount.findMany({
      where: {
        enrichmentStatus: 'PENDING',
        updatedAt: { lt: cutoff },
      },
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
        // Mark as FAILED let the fintech know rather 
        await this.prisma.bankAccount.update({
          where: { id: account.id },
          data: { enrichmentStatus: 'FAILED' },
        });

        await this.outboundWebhookService.dispatch(
          account.applicant.fintechId,
          'account.enrichment_failed',
          {
            accountId:   account.id,
            monoAccountId: account.monoAccountId,
            applicantId: account.applicantId,
            reason:      'enrichment_timeout',
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
}
