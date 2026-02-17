import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { EmailService } from 'src/email/email.service';

@Processor('emails', { concurrency: 3 })
@Injectable()
export class EmailProcessor extends WorkerHost {
  constructor(
    private readonly emailService: EmailService,
    private readonly logger: PinoLogger,
  ) {
    super();
    this.logger.setContext(EmailProcessor.name);
  }

  async process(job: Job) {
    this.logger.info({ jobId: job.id, type: job.name }, 'Processing email job');

    const { email, otp, name } = job.data;

    switch (job.name) {
      case 'send-otp':
      case 'resend-otp':
        await this.emailService.sendOTP(email, otp, name);
        break;
      case 'send-password-reset':
        await this.emailService.sendPasswordResetOTP(email, otp, name);
        break;
      default:
        this.logger.warn({ jobName: job.name }, 'Unknown email job type');
    }

    this.logger.info({ jobId: job.id }, 'Email job completed');
    return { completed: true };
  }
}
