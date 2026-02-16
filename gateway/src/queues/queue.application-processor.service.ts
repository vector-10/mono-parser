import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { ApplicationProcessorService } from 'src/applications/applications-processor.service';

@Processor('applications')
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
        this.logger.info({ jobId: job.id, data: job.data}, 'Processing job');

        const { applicationId, clientId } = job.data;
        await this.applicationProcessorService.processApplication(applicationId, clientId);

        this.logger.info({ jobId: job.id }, 'Job completed');

        return { completed: true };
    }
}