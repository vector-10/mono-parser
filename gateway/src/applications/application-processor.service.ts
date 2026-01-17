import { Injectable, Logger } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { DataAggregationService } from './data-aggregation.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ApplicationProcessorService {
  private readonly logger = new Logger(ApplicationProcessorService.name);

  constructor(
    private applicationsService: ApplicationsService,
    private dataAggregationService: DataAggregationService,
    private prisma: PrismaService,
  ) {}

  async processApplication(applicationId: string) {
    this.logger.log(`Starting processing for application ${applicationId}`);

    try {
      // 1. Get application details
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

      // 2. Gather all financial data from Mono
      this.logger.log(`Fetching data for account ${bankAccount.monoAccountId}`);
      const financialData = await this.dataAggregationService.gatherApplicantData(
        bankAccount.monoAccountId,
        monoApiKey,
        application.applicant.bvn,
      );

      // 3. TODO: Send to Brain for analysis
      // const decision = await this.brainService.analyze(financialData, application.amount);
      
      // For now, mock decision
      const mockDecision = {
        recommendation: 'approved',
        score: 750,
        suggestedAmount: application.amount * 0.8,
        narrative: 'Mock analysis - Brain service not yet implemented',
      };

      // 4. Update application with results
      await this.applicationsService.updateStatus(
        applicationId,
        'COMPLETED',
        mockDecision.score,
        mockDecision,
      );

      this.logger.log(`✅ Application ${applicationId} processed successfully`);

      // 5. TODO: Send webhook to fintech
      // await this.webhookService.notifyFintech(application.applicant.fintechId, result);

      return { success: true, applicationId };
    } catch (error) {
      this.logger.error(`Failed to process application ${applicationId}:`, error);

      // Update application to FAILED status
      await this.applicationsService.updateStatus(
        applicationId,
        'FAILED',
        null,
        { error: error.message },
      );

      return { success: false, error: error.message };
    }
  }
}