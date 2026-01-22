import { Injectable, Logger } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { DataAggregationService } from './data-aggregation.service';
import { EventsGateway } from 'src/events/events.gateway'; 
import { MonoService } from 'src/mono/mono.service'
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ApplicationProcessorService {
  private readonly logger = new Logger(ApplicationProcessorService.name);

  constructor(
    private applicationsService: ApplicationsService,
    private dataAggregationService: DataAggregationService,
    private eventsGateway: EventsGateway, 
    private prisma: PrismaService,
    private monoService: MonoService
  ) {}

  async processApplication(applicationId: string, clientId?: string) {
    this.logger.log(`Starting processing for application ${applicationId}`);

    try {
      if (clientId) {
        this.eventsGateway.emitApplicationProgress(
          clientId,
          '📊 Fetching applicant data...',
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

      const bankAccount = application.applicant.bankAccounts[0];
      const monoApiKey = application.applicant.fintech.monoApiKey;

      if (!bankAccount || !monoApiKey) {
        throw new Error('Missing bank account or API key');
      }

      if (clientId) {
        this.eventsGateway.emitApplicationProgress(
          clientId,
          '✓ Applicant verified. Fetching bank data...',
        );
      }

      this.logger.log(`Fetching data for account ${bankAccount.monoAccountId}`);
      const financialData =
        await this.dataAggregationService.gatherApplicantData(
          bankAccount.monoAccountId,
          monoApiKey,
          application.applicant.bvn || undefined,
        );

      if (clientId) {
        this.eventsGateway.emitApplicationProgress(
          clientId,
          '💳 Analyzing transactions and income...',
        );
      }

       // ========== ADD THIS BLOCK (COMMENTED OUT) ==========
      /*
      // Optional: Get Mono's built-in creditworthiness score
      let monoCreditScore = null;
      if (application.applicant.bvn) {
        try {
          if (clientId) {
            this.eventsGateway.emitApplicationProgress(
              clientId,
              '🔍 Checking Mono creditworthiness...',
            );
          }

          monoCreditScore = await this.monoService.getCreditWorthiness(
            bankAccount.monoAccountId,
            monoApiKey,
            {
              bvn: application.applicant.bvn,
              principal: application.amount,
              interest_rate: 5, // TODO: Make configurable
              term: 12, // TODO: Get from application or make configurable
            }
          );

          this.logger.log(`Mono credit score retrieved for application ${applicationId}`);
        } catch (error) {
          this.logger.warn(
            `Mono creditworthiness check failed for application ${applicationId}, continuing without it`,
            error,
          );
          // Continue without it - not critical to the flow
        }
      }
      */
      // ========== END BLOCK ==========

      if (clientId) {
        this.eventsGateway.emitApplicationProgress(
          clientId,
          '🧠 Running creditworthiness analysis...',
        );
      }

      const mockDecision = {
        recommendation: 'approved',
        score: 750,
        suggestedAmount: application.amount * 0.8,
        narrative: 'Mock analysis - Brain service not yet implemented',
      };

      const updatedApp = await this.applicationsService.updateStatus(
        applicationId,
        'COMPLETED',
        mockDecision.score,
        mockDecision,
      );

      this.logger.log(
        `✅ Application ${applicationId} processed successfully`,
      );

      if (clientId) {
        this.eventsGateway.emitApplicationComplete(clientId, {
          applicationId: updatedApp.id,
          status: updatedApp.status,
          score: updatedApp.score,
          decision: updatedApp.decision,
          message: '✅ Analysis complete!',
        });
      }

      return { success: true, applicationId };
    } catch (error) {
      this.logger.error(
        `Failed to process application ${applicationId}:`,
        error,
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
}