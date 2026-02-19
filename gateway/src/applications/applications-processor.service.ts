import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { ApplicationsService } from './applications.service';
import { DataAggregationService } from './data-aggregation.service';
import { EventsGateway } from 'src/events/events.gateway';
import { PrismaService } from 'src/prisma/prisma.service';
import { OutboundWebhookService } from 'src/queues/outbound-webhook.service';

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
  ) {
    this.logger.setContext(ApplicationProcessorService.name);
    this.brainUrl = this.configService.get<string>(
      'BRAIN_API_URL',
      'http://brain:8000',
    );
    this.logger.info(
      { brainUrl: this.brainUrl },
      'Brain service URL configured',
    );
  }

  async processApplication(applicationId: string, clientId?: string) {
    this.logger.info({ applicationId }, 'Starting processing for application');

    try {
      if (clientId) {
        this.eventsGateway.emitApplicationProgress(
          clientId,
          'Fetching applicant data...',
        );
      }

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

      const accountIds = application.applicant.bankAccounts.map(
        (acc) => acc.monoAccountId,
      );
      const monoApiKey = application.applicant.fintech.monoApiKey;

      if (!accountIds.length || !monoApiKey) {
        throw new Error('Missing bank accounts or API key');
      }

      if (clientId) {
        this.eventsGateway.emitApplicationProgress(
          clientId,
          `Applicant verified. Analyzing ${accountIds.length} bank account${accountIds.length > 1 ? 's' : ''}.`,
        );
      }

      this.logger.info(
        { accountIds, count: accountIds.length },
        'Fetching data for multiple accounts',
      );

      const financialData =
        await this.dataAggregationService.gatherMultiAccountData(
          accountIds,
          monoApiKey,
        );

      if (clientId) {
        this.eventsGateway.emitApplicationProgress(
          clientId,
          'Analyzing transactions and income...',
        );
      }

      if (clientId) {
        this.eventsGateway.emitApplicationProgress(
          clientId,
          'Running creditworthiness analysis...',
        );
      }

      const brainResponse = await this.callBrainService({
        applicant_id: application.applicantId,
        loan_amount: application.amount,
        tenor_months: application.tenor,
        interest_rate: application.interestRate,
        purpose: application.purpose,
        accounts: financialData.accounts,
      });

      this.logger.info(
        {
          applicationId,
          decision: brainResponse.decision.decision,
          score: brainResponse.score,
          accountsAnalyzed: financialData.totalAccounts,
        },
        'Brain analysis complete',
      );

      const bankAccountIds = application.applicant.bankAccounts.map(
        (acc) => acc.id,
      );

      const updatedApp = await this.applicationsService.updateStatus(
        applicationId,
        'COMPLETED',
        brainResponse.score,
        brainResponse,
        bankAccountIds,
      );

      this.logger.info(
        { applicationId },
        'Loan application processed successfully',
      );

      this.logger.info(
        { applicationId, clientId, hasClientId: !!clientId },
        'About to emit application complete',
      );

      if (clientId) {
        this.eventsGateway.emitApplicationComplete(clientId, {
          applicationId: updatedApp.id,
          status: updatedApp.status,
          score: updatedApp.score,
          decision: updatedApp.decision,
          message: 'Analysis complete!',
        });
      }

      await this.outboundWebhookService.dispatch(
        application.applicant.fintechId,
        'application.decision',
        {
          applicationId: updatedApp.id,
          applicantId: application.applicantId,
          status: updatedApp.status,
          score: updatedApp.score,
          decision: updatedApp.decision,
        },
      );

      return { success: true, applicationId };
    } catch (error) {
      this.logger.error(
        { err: error, applicationId },
        'Failed to process application',
      );

      await this.applicationsService.updateStatus(
        applicationId,
        'FAILED',
        undefined,
        { error: error.message },
      );

      if (clientId) {
        this.eventsGateway.emitApplicationError(
          clientId,
          `Processing failed: ${error.message}`,
        );
      }

      return { success: false, error: error.message };
    }
  }

  private async callBrainService(payload: any) {
    this.logger.info(`Calling Brain service at ${this.brainUrl}/analyze`);

    const brainPayload = {
      applicant_id: payload.applicant_id,
      loan_amount: payload.loan_amount,
      tenor_months: payload.tenor_months,
      interest_rate: payload.interest_rate,
      accounts: payload.accounts,
    };

    this.logger.info(
      { brainPayload: JSON.stringify(brainPayload, null, 2) },
      'Sending payload to brain',
    );

    const response = await fetch(`${this.brainUrl}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(brainPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(
        {
          status: response.status,
          errorText,
          applicantId: payload.applicant_id,
          brainUrl: this.brainUrl,
        },
        'Brain service error',
      );
      throw new Error(`Brain service failed: ${response.statusText}`);
    }

    const result = await response.json();
    this.logger.info(
      {
        applicantId: payload.applicant_id,
        score: result.score,
        decision: result.decision?.decision,
      },
      'Brain service response received',
    );

    return result;
  }
}
