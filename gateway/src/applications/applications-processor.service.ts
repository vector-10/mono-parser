import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { ApplicationsService } from './applications.service';
import { DataAggregationService } from './data-aggregation.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { OutboundWebhookService } from 'src/queues/outbound-webhook.service';
import { MonoService } from 'src/mono/mono.service';

const SYNC_DATA_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export class BrainUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BrainUnavailableError';
  }
}

@Injectable()
export class ApplicationProcessorService {
  private readonly brainUrl: string;

  constructor(
    private applicationsService: ApplicationsService,
    private dataAggregationService: DataAggregationService,
    private prisma: PrismaService,
    private configService: ConfigService,
    private readonly logger: PinoLogger,
    private readonly outboundWebhookService: OutboundWebhookService,
    private readonly monoService: MonoService,
  ) {
    this.logger.setContext(ApplicationProcessorService.name);
    this.brainUrl = this.configService.get<string>('BRAIN_API_URL', 'http://brain:8000');
    this.logger.info({ brainUrl: this.brainUrl }, 'Brain service URL configured');
  }

  async processApplication(applicationId: string) {
    this.logger.info({ applicationId }, 'Starting application processing');

    try {
      const application = await this.prisma.application.findUnique({
        where: { id: applicationId },
        include: {
          applicant: {
            include: {
              bankAccounts: true,
              fintech: true,
            },
          },
        },
      });

      if (!application) {
        throw new Error('Application not found');
      }

      const { applicant } = application;
      const monoApiKey = applicant.fintech.monoApiKey;

      if (!monoApiKey) {
        throw new Error('Fintech Mono API key not configured');
      }

      if (!applicant.bankAccounts.length) {
        throw new Error('Applicant has no linked bank accounts');
      }

      const targetAccounts = application.bankAccountIds.length
        ? applicant.bankAccounts.filter((acc) => application.bankAccountIds.includes(acc.id))
        : applicant.bankAccounts;

      const readyAccounts  = targetAccounts.filter((acc) => acc.enrichmentStatus === 'READY');
      const failedAccounts = targetAccounts.filter((acc) => acc.enrichmentStatus === 'FAILED');

      if (failedAccounts.length > 0) {
        this.logger.warn(
          { count: failedAccounts.length, applicationId },
          'Skipping accounts with FAILED enrichment',
        );
      }

      if (!readyAccounts.length) {
        throw new Error('No accounts with completed enrichment available for analysis');
      }

      await this.refreshStaleAccounts(readyAccounts, monoApiKey);

      const monoAccountIds = readyAccounts.map((acc) => acc.monoAccountId);
      const accountsData = await this.dataAggregationService.gatherMultiAccountData(monoAccountIds);

      let creditHistory: any = null;
      if (applicant.bvn) {
        try {
          creditHistory = await this.monoService.getCreditHistory(applicant.bvn, monoApiKey);
          this.logger.info({ applicantId: applicant.id }, 'Credit history fetched');
        } catch (err) {
          this.logger.warn(
            { err, applicantId: applicant.id },
            'Credit history lookup failed — proceeding as thin-file',
          );
        }
      } else {
        this.logger.info({ applicantId: applicant.id }, 'No BVN on record — skipping credit history lookup');
      }

      const brainResponse = await this.callBrainService({
        applicant_id:   application.applicantId,
        applicant_name: `${applicant.firstName} ${applicant.lastName}`,
        applicant_bvn:  applicant.bvn ?? '',
        loan_amount:    application.amount,
        tenor_months:   application.tenor,
        interest_rate:  application.interestRate,
        purpose:        application.purpose,
        accounts:       accountsData,
        credit_history: creditHistory,
      });

      this.logger.info(
        { applicationId, decision: brainResponse.decision, score: brainResponse.score },
        'Brain analysis complete',
      );

      const bankAccountIds = applicant.bankAccounts.map((acc) => acc.id);
      const finalStatus = brainResponse.decision === 'MANUAL_REVIEW' ? 'MANUAL_REVIEW' : 'COMPLETED';
      const updatedApp = await this.applicationsService.updateStatus(
        applicationId,
        finalStatus,
        brainResponse.score,
        brainResponse,
        bankAccountIds,
      );

      await this.outboundWebhookService.dispatch(
        applicant.fintechId,
        'application.decision',
        {
          applicationId: updatedApp.id,
          applicantId:   application.applicantId,
          status:        updatedApp.status,
          score:         updatedApp.score,
          decision:      updatedApp.decision,
        },
      );

      return { success: true, applicationId };
    } catch (error) {
      this.logger.error({ err: error, applicationId }, 'Failed to process application');

      if (error.name === 'BrainUnavailableError') {
        this.logger.warn({ applicationId }, 'Brain unavailable — allowing BullMQ to retry');
        throw error;
      }

      await this.handleProcessingFailure(applicationId, error);
      return { success: false, error: error.message };
    }
  }

  async handleProcessingFailure(applicationId: string, error: Error): Promise<void> {
    await this.applicationsService.updateStatus(applicationId, 'FAILED', undefined, {
      error: error.message,
    });

    const failedApp = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: { applicant: true },
    });

    if (failedApp) {
      await this.outboundWebhookService.dispatch(
        failedApp.applicant.fintechId,
        'application.failed',
        {
          applicationId,
          applicantId: failedApp.applicantId,
          status:      'FAILED',
          reason:      error.message,
        },
      );
    }
  }

  private async refreshStaleAccounts(
    accounts: Array<{ id: string; monoAccountId: string; syncDataFetchedAt: Date | null }>,
    monoApiKey: string,
  ): Promise<void> {
    const now = Date.now();

    const stale = accounts.filter(
      (acc) => !acc.syncDataFetchedAt || now - acc.syncDataFetchedAt.getTime() > SYNC_DATA_MAX_AGE_MS,
    );

    if (!stale.length) {
      this.logger.info({ count: accounts.length }, 'All accounts have fresh sync data');
      return;
    }

    this.logger.info({ count: stale.length }, 'Refreshing stale sync data before analysis');

    await Promise.all(
      stale.map(async (acc) => {
        const [balance, transactions] = await Promise.allSettled([
          this.monoService.getAccountBalance(acc.monoAccountId, monoApiKey),
          this.monoService.getTransactions(acc.monoAccountId, monoApiKey),
        ]);

        const bothFailed =
          balance.status === 'rejected' && transactions.status === 'rejected';

        if (bothFailed) {
          this.logger.warn(
            { monoAccountId: acc.monoAccountId },
            'Sync refresh failed for account — proceeding with stale data',
          );
          return;
        }

        await this.prisma.bankAccount.update({
          where: { id: acc.id },
          data: {
            ...(balance.status === 'fulfilled' && { balanceData: balance.value }),
            ...(transactions.status === 'fulfilled' && { transactionsData: transactions.value }),
            syncDataFetchedAt: new Date(),
          },
        });

        this.logger.info({ monoAccountId: acc.monoAccountId }, 'Sync data refreshed');
      }),
    );
  }

  private async callBrainService(payload: {
    applicant_id:   string;
    applicant_name: string;
    applicant_bvn:  string;
    loan_amount:    number;
    tenor_months:   number;
    interest_rate:  number;
    purpose?:       string | null;
    accounts:       any[];
    credit_history: any;
  }) {
    this.logger.info(`Calling brain at ${this.brainUrl}/analyze`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    let response: Response;

    try {
      response = await fetch(`${this.brainUrl}/analyze`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
        signal:  controller.signal,
      });
    } catch (err) {
      clearTimeout(timeout);
      throw new BrainUnavailableError(`Brain service unreachable: ${err.message}`);
    }

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error({ status: response.status, errorText }, 'Brain service returned an error');

      if (response.status >= 500) {
        throw new BrainUnavailableError(`Brain service unavailable (${response.status}): ${errorText}`);
      }

      throw new Error(`Brain service rejected request (${response.status}): ${errorText}`);
    }

    return response.json();
  }
}
