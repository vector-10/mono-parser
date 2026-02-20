import { Processor, WorkerHost } from '@nestjs/bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { Prisma } from '@prisma/client';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from 'src/prisma/prisma.service';
import { MonoService } from 'src/mono/mono.service';
import { OutboundWebhookService } from './outbound-webhook.service';


const MAX_POLL_ATTEMPTS = 30;
const POLL_INTERVAL_MS  = 30_000;

interface PollInsightsJobData {
  bankAccountId: string;   
  monoAccountId: string;   
  jobId:         string;   
  monoApiKey:    string;   
  pollAttempt:   number;   
}

@Processor('enrichments')
export class EnrichmentPollerProcessor extends WorkerHost {
  constructor(
    private readonly prisma: PrismaService,
    private readonly monoService: MonoService,
    private readonly outboundWebhookService: OutboundWebhookService,
    private readonly logger: PinoLogger,
    @InjectQueue('enrichments') private readonly enrichmentsQueue: Queue,
  ) {
    super();
    this.logger.setContext(EnrichmentPollerProcessor.name);
  }

  // ─── BullMQ entry point ───────────────────────────────────────────────────
  async process(job: Job<PollInsightsJobData>): Promise<void> {
    const { bankAccountId, monoAccountId, jobId, monoApiKey, pollAttempt } = job.data;

    this.logger.info(
      { monoAccountId, jobId, pollAttempt },
      'Polling Mono for statement insights result',
    );

    if (pollAttempt >= MAX_POLL_ATTEMPTS) {
      await this._markFailed(bankAccountId, monoAccountId, jobId);
      return;
    }

    let record: any;
    try {
      record = await this.monoService.pollEnrichmentRecord(jobId, monoApiKey);
    } catch (err) {
      this.logger.warn({ err, jobId, pollAttempt }, 'Poll request failed, will retry');
      await this._reschedule(job.data);
      return;
    }

    const status: string = (record?.status ?? '').toLowerCase();

    if (status === 'successful' || status === 'success') {
      // ── Job complete ────────────────────────────────────────────────────────
      const insightsPayload = record.jobData ?? record;

      await this.prisma.bankAccount.update({
        where: { id: bankAccountId },
        data: { statementInsightsData: insightsPayload },
      });

      this.logger.info({ monoAccountId, jobId }, 'Statement insights stored successfully');

      await this._checkAndFireEnrichmentReady(monoAccountId);

    } else if (status === 'failed' || status === 'error') {
      // ── Mono-side failure ───────────────────────────────────────────────────
      this.logger.error(
        { monoAccountId, jobId, record },
        'Mono reported statement insights job as failed',
      );
      await this._markFailed(bankAccountId, monoAccountId, jobId);

    } else {
      // ── Still processing (pending / processing / queued) ────────────────────
      this.logger.info(
        { monoAccountId, jobId, status, pollAttempt },
        'Insights job still pending, re-scheduling poll',
      );
      await this._reschedule(job.data);
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private async _reschedule(data: PollInsightsJobData): Promise<void> {
    await this.enrichmentsQueue.add(
      'poll-insights',
      { ...data, pollAttempt: data.pollAttempt + 1 },
      { delay: POLL_INTERVAL_MS },
    );
  }

  private async _markFailed(
    bankAccountId: string,
    monoAccountId: string,
    jobId: string,
  ): Promise<void> {
    this.logger.error(
      { bankAccountId, monoAccountId, jobId },
      'Statement insights enrichment failed or timed out after 15 minutes',
    );

    await this.prisma.bankAccount.update({
      where: { id: bankAccountId },
      data: { enrichmentStatus: 'FAILED' },
    });
  }

 
  private async _checkAndFireEnrichmentReady(monoAccountId: string): Promise<void> {
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
      this.logger.info({ monoAccountId }, 'Insights stored, waiting for income webhook');
      return;
    }

    const account = await this.prisma.bankAccount.findUnique({
      where: { monoAccountId },
      include: { applicant: true },
    });

    if (!account) return;

    this.logger.info({ monoAccountId }, 'Both enrichments ready (poller completed last)');

    await this.outboundWebhookService.dispatch(
      account.applicant.fintechId,
      'account.enrichment_ready',
      {
        accountId: account.id,
        monoAccountId,
        applicantId: account.applicantId,
        message:
          'Account enrichment complete. You may now submit this applicant for loan analysis.',
      },
    );
  }
}
