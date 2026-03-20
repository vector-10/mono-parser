import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { ApplicationProcessorService } from 'src/applications/applications-processor.service';

@Processor('applications', { concurrency: 5 })
@Injectable()
export class ApplicationProcessor extends WorkerHost {
  constructor(
    private readonly applicationProcessorService: ApplicationProcessorService,
    private readonly logger: PinoLogger,
  ) {
    super();
    this.logger.setContext(ApplicationProcessor.name);
  }

  async process(job: Job) {
    this.logger.info({ jobId: job.id, data: job.data }, 'Processing job');

    const { applicationId } = job.data;

    try {
      await this.applicationProcessorService.processApplication(applicationId);
      this.logger.info({ jobId: job.id }, 'Job completed');
      return { completed: true };
    } catch (error) {
      const maxAttempts = job.opts.attempts ?? 3;
      const isLastAttempt = job.attemptsMade >= maxAttempts - 1;

      if (isLastAttempt) {
        this.logger.error(
          { jobId: job.id, applicationId, attemptsMade: job.attemptsMade },
          'All retry attempts exhausted — marking application as failed',
        );
        await this.applicationProcessorService.handleProcessingFailure(applicationId, error);
      } else {
        this.logger.warn(
          { jobId: job.id, applicationId, attemptsMade: job.attemptsMade, maxAttempts },
          'Job failed, will retry',
        );
      }

      throw error;
    }
  }
}
