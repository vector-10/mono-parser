import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { ApplicationsService } from './applications.service';
import { DataAggregationService } from './data-aggregation.service';
import { EventsGateway } from 'src/events/events.gateway';
import { PrismaService } from 'src/prisma/prisma.service';
import { OutboundWebhookService } from 'src/queues/outbound-webhook.service';
import { MonoService } from 'src/mono/mono.service';

@Injectable()
export class ApplicationProcessorService {
  private readonly brainUrl: string;

  constructor(
    private applicationsService: ApplicationsService,
    private dataAggregationService: DataAggregationService,
    private eventsGateway: EventsGateway,
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

  async processApplication(applicationId: string, clientId?: string) {
    this.logger.info({ applicationId }, 'Starting application processing');

    try {
      if (clientId) {
        this.eventsGateway.emitApplicationProgress(clientId, 'Fetching applicant data...');
      }

      // ── Load application with all related data ────────────────────────────
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
      const monoApiKey   = applicant.fintech.monoApiKey;

      if (!monoApiKey) {
        throw new Error('Fintech Mono API key not configured');
      }

      if (!applicant.bankAccounts.length) {
        throw new Error('Applicant has no linked bank accounts');
      }

      // ── Enrichment readiness check ────────────────────────────────────────
      // All linked accounts must have their enrichments complete before we
      // run the brain. If any account is still PENDING or FAILED we stop here
      // so we never score on incomplete data.
      const notReady = applicant.bankAccounts.filter(
        (acc) => acc.enrichmentStatus !== 'READY',
      );
      if (notReady.length > 0) {
        const statuses = notReady
          .map((a) => `${a.monoAccountId}:${a.enrichmentStatus}`)
          .join(', ');
        throw new Error(
          `Enrichment not complete for ${notReady.length} account(s): ${statuses}. ` +
          'Wait for the account.enrichment_ready event before submitting for analysis.',
        );
      }

      if (clientId) {
        this.eventsGateway.emitApplicationProgress(
          clientId,
          `Analysing ${applicant.bankAccounts.length} bank account(s)...`,
        );
      }

      // ── Gather live + stored data for all accounts ────────────────────────
      const monoAccountIds = applicant.bankAccounts.map((acc) => acc.monoAccountId);
      const accountsData   = await this.dataAggregationService.gatherMultiAccountData(
        monoAccountIds,
        monoApiKey,
      );

      if (clientId) {
        this.eventsGateway.emitApplicationProgress(clientId, 'Looking up credit history...');
      }

      // ── Credit history — BVN-level, one per applicant ─────────────────────
      // Non-fatal: if the lookup fails (BVN missing, bureau unavailable) the
      // brain treats the applicant as thin-file, which is the safe default.
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
        this.logger.info(
          { applicantId: applicant.id },
          'No BVN on record — skipping credit history lookup',
        );
      }

      if (clientId) {
        this.eventsGateway.emitApplicationProgress(clientId, 'Running credit analysis...');
      }

      // ── Call the brain service ────────────────────────────────────────────
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

      // ── Persist decision ──────────────────────────────────────────────────
      const bankAccountIds = applicant.bankAccounts.map((acc) => acc.id);
      const updatedApp = await this.applicationsService.updateStatus(
        applicationId,
        'COMPLETED',
        brainResponse.score,
        brainResponse,
        bankAccountIds,
      );

      if (clientId) {
        this.eventsGateway.emitApplicationComplete(clientId, {
          applicationId: updatedApp.id,
          status:        updatedApp.status,
          score:         updatedApp.score,
          decision:      updatedApp.decision,
          message:       'Analysis complete!',
        });
      }

      // ── Dispatch outbound webhook to fintech ──────────────────────────────
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

      await this.applicationsService.updateStatus(applicationId, 'FAILED', undefined, {
        error: error.message,
      });

      if (clientId) {
        this.eventsGateway.emitApplicationError(
          clientId,
          `Processing failed: ${error.message}`,
        );
      }

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

      return { success: false, error: error.message };
    }
  }

  // ─── Brain HTTP call ───────────────────────────────────────────────────────

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

    const response = await fetch(`${this.brainUrl}/analyze`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(
        { status: response.status, errorText },
        'Brain service returned an error',
      );
      throw new Error(`Brain service failed (${response.status}): ${errorText}`);
    }

    return response.json();
  }
}
