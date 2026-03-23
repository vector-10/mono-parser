import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { MonoService } from 'src/mono/mono.service';
import { OutboundWebhookService } from 'src/queues/outbound-webhook.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { InitiateApplicationDto } from './dto/initiate-application.dto';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class ApplicationsService {
  constructor(
    private prisma: PrismaService,
    private monoService: MonoService,
    private readonly outboundWebhookService: OutboundWebhookService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ApplicationsService.name);
  }

  async initiateApplication(fintechId: string, data: InitiateApplicationDto) {
    const { firstName, lastName, email, phone, bvn, amount, tenor, interestRate, purpose, idempotencyKey } = data;

    this.logger.info({ fintechId, email, idempotencyKey }, 'Initiating new application');

    const applicant = await this.prisma.applicant.upsert({
      where: { email_fintechId: { email, fintechId } },
      create: { firstName, lastName, email, phone, bvn, fintechId },
      update: { firstName, lastName, phone, bvn },
    });

    const existing = await this.prisma.application.findUnique({
      where: { idempotencyKey },
      include: { applicant: true },
    });

    if (existing) {
      if (existing.applicant.fintechId !== fintechId) {
        throw new ForbiddenException('Idempotency key does not belong to this account');
      }

      if (['LINKED', 'PROCESSING', 'COMPLETED', 'FAILED'].includes(existing.status)) {
        throw new ConflictException(
          `Application already exists with status: ${existing.status}. Use a new idempotency key for a new application.`,
        );
      }

      if (existing.status === 'ABANDONED' || existing.status === 'PENDING_LINKING') {
        const fintech = await this.prisma.user.findUnique({
          where: { id: fintechId },
          select: { monoApiKey: true },
        });

        if (!fintech?.monoApiKey) {
          throw new InternalServerErrorException('Mono API key not configured');
        }

        await this.prisma.application.update({
          where: { id: existing.id },
          data: {
            status:          'PENDING_LINKING',
            abandonedAt:     null,
            linkingFinalized: false,
          },
        });

        const { widgetUrl } = await this.monoService.initiateAccountLinking(
          applicant.id,
          `${firstName} ${lastName}`,
          email,
          fintech.monoApiKey,
          undefined,
          existing.id,
        );

        this.logger.info({ applicationId: existing.id }, 'Application re-activated');

        return {
          applicationId: existing.id,
          applicantId:   applicant.id,
          widgetUrl,
          status:        'PENDING_LINKING',
          resumed:       true,
        };
      }
    }

    this.logger.info({ applicantId: applicant.id, fintechId }, 'Applicant upserted');

    const application = await this.prisma.application.create({
      data: {
        applicantId: applicant.id,
        amount,
        tenor,
        interestRate,
        purpose,
        idempotencyKey,
        status: 'PENDING_LINKING',
      },
    });

    this.logger.info({ applicationId: application.id, applicantId: applicant.id }, 'Application record created');

    const fintech = await this.prisma.user.findUnique({
      where: { id: fintechId },
      select: { monoApiKey: true },
    });

    if (!fintech || !fintech.monoApiKey) {
      this.logger.error({ fintechId }, 'Mono API key not configured for this account');
      throw new InternalServerErrorException('Mono API key not configured for this account');
    }

    const { widgetUrl } = await this.monoService.initiateAccountLinking(
      applicant.id,
      `${firstName} ${lastName}`,
      email,
      fintech.monoApiKey,
      undefined,
      application.id,
    );

    this.logger.info({ applicationId: application.id, applicantId: applicant.id }, 'Mono Connect widget URL generated');

    return {
      applicationId: application.id,
      applicantId:   applicant.id,
      widgetUrl,
      status:        'PENDING_LINKING',
      resumed:       false,
    };
  }

  async linkAccount(applicationId: string, fintechId: string) {
    this.logger.info({ applicationId, fintechId }, 'Re-link request received');

    const application = await this.prisma.application.findFirst({
      where: { id: applicationId, applicant: { fintechId } },
      include: { applicant: true },
    });

    if (!application) {
      this.logger.warn({ applicationId, fintechId }, 'Application not found or unauthorized for re-link');
      throw new NotFoundException('Application not found or unauthorized');
    }

    if (['COMPLETED', 'FAILED', 'ABANDONED'].includes(application.status)) {
      this.logger.warn({ applicationId, status: application.status }, 'Re-link rejected — application is in a terminal state');
      throw new BadRequestException(`Cannot link accounts to an application with status: ${application.status}`);
    }

    const fintech = await this.prisma.user.findUnique({
      where: { id: fintechId },
      select: { monoApiKey: true },
    });

    if (!fintech || !fintech.monoApiKey) {
      this.logger.error({ fintechId }, 'Mono API key not configured for this account');
      throw new InternalServerErrorException('Mono API key not configured for this account');
    }

    const { applicant } = application;
    const { widgetUrl } = await this.monoService.initiateAccountLinking(
      applicant.id,
      `${applicant.firstName} ${applicant.lastName}`,
      applicant.email,
      fintech.monoApiKey,
      undefined,
      applicationId,
    );

    this.logger.info({ applicationId, applicantId: applicant.id }, 'Mono Connect re-link widget URL generated');

    return { widgetUrl };
  }

  async finalizeAccountLinking(applicationId: string, fintechId: string) {
    this.logger.info({ applicationId, fintechId }, 'Finalize linking request received');

    const application = await this.prisma.application.findFirst({
      where: { id: applicationId, applicant: { fintechId } },
      include: { applicant: true },
    });

    if (!application) {
      throw new NotFoundException('Application not found or unauthorized');
    }

    if (application.status !== 'LINKED') {
      throw new BadRequestException(
        `Cannot finalize linking for application with status: ${application.status}`,
      );
    }

    if (!application.bankAccountIds.length) {
      throw new BadRequestException('No accounts have been linked to this application yet');
    }

    await this.prisma.application.update({
      where: { id: applicationId },
      data: { linkingFinalized: true },
    });

    const accounts = await this.prisma.bankAccount.findMany({
      where: { id: { in: application.bankAccountIds } },
      select: { enrichmentStatus: true },
    });

    const allReady = accounts.every((a) => a.enrichmentStatus === 'READY');

    if (allReady) {
      await this.outboundWebhookService.dispatch(fintechId, 'application.ready_for_analysis', {
        applicationId,
        applicantId:  application.applicantId,
        accountCount: application.bankAccountIds.length,
        message:      'All accounts are enriched. You may now submit for analysis.',
      });

      this.logger.info({ applicationId }, 'application.ready_for_analysis fired immediately on finalize');
    }

    return {
      applicationId,
      linkingFinalized: true,
      accountCount:     application.bankAccountIds.length,
      allReady,
      message: allReady
        ? 'All accounts already enriched. application.ready_for_analysis has been sent.'
        : 'Linking finalized. You will receive application.ready_for_analysis once all accounts complete enrichment.',
    };
  }

  async createApplication(fintechId: string, data: CreateApplicationDto) {
    const { applicantId, amount, tenor, interestRate, purpose } = data;

    this.logger.info({ fintechId, applicantId, amount, tenor }, 'Creating standalone application');

    const applicant = await this.prisma.applicant.findFirst({
      where: { id: applicantId, fintechId },
      include: { bankAccounts: true },
    });

    if (!applicant) {
      this.logger.warn({ applicantId, fintechId }, 'Applicant not found or unauthorized');
      throw new NotFoundException('Applicant not found or unauthorized');
    }

    if (!applicant.bankAccounts.length) {
      this.logger.warn({ applicantId }, 'Applicant has no linked bank accounts');
      throw new BadRequestException('Applicant has not linked a bank account');
    }

    this.logger.info({ applicantId, bankAccountCount: applicant.bankAccounts.length }, 'Applicant validated — bank accounts present');

    const application = await this.prisma.application.create({
      data: {
        applicantId,
        amount,
        tenor,
        interestRate,
        purpose,
        status: 'PENDING',
      },
      include: {
        applicant: {
          include: { bankAccounts: true },
        },
      },
    });

    this.logger.info({ applicationId: application.id, applicantId }, 'Standalone application created');

    return application;
  }

  async findOne(applicationId: string, fintechId: string) {
    this.logger.info({ applicationId, fintechId }, 'Fetching single application');

    const application = await this.prisma.application.findFirst({
      where: {
        id: applicationId,
        applicant: { fintechId },
      },
      include: {
        applicant: {
          include: { bankAccounts: true },
        },
      },
    });

    if (!application) {
      this.logger.warn({ applicationId, fintechId }, 'Application not found');
      throw new NotFoundException('Application not found');
    }

    return application;
  }

  async findAll(fintechId: string, status?: string, search?: string) {
    this.logger.info({ fintechId, status: status ?? 'all', search }, 'Fetching applications list');

    return this.prisma.application.findMany({
      where: {
        applicant: { fintechId },
        ...(status && { status }),
        ...(search && {
          OR: [
            { applicant: { firstName: { contains: search, mode: 'insensitive' } } },
            { applicant: { lastName: { contains: search, mode: 'insensitive' } } },
            { applicant: { email: { contains: search, mode: 'insensitive' } } },
          ],
        }),
      },
      include: { applicant: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async manualDecision(applicationId: string, fintechId: string, action: 'APPROVE' | 'DECLINE') {
    const application = await this.prisma.application.findFirst({
      where: { id: applicationId, applicant: { fintechId }, status: 'MANUAL_REVIEW' },
    });

    if (!application) throw new NotFoundException('Application not found or not in manual review');

    const existing = (application.decision as Record<string, unknown>) ?? {};

    return this.prisma.application.update({
      where: { id: applicationId },
      data: {
        status: 'COMPLETED',
        decision: {
          ...existing,
          decision: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
          manually_reviewed: true,
          reviewed_at: new Date().toISOString(),
        },
        updatedAt: new Date(),
      },
    });
  }

  async flagForManualReview(applicationId: string, fintechId: string) {
    const application = await this.prisma.application.findFirst({
      where: { id: applicationId, applicant: { fintechId } },
    });

    if (!application) throw new NotFoundException('Application not found');

    const existing = (application.decision as Record<string, unknown>) ?? {};

    return this.prisma.application.update({
      where: { id: applicationId },
      data: {
        status: 'MANUAL_REVIEW',
        decision: { ...existing, manually_flagged: true, flagged_at: new Date().toISOString() },
        updatedAt: new Date(),
      },
    });
  }

  async updateStatus(
    applicationId: string,
    status: string,
    score?: number,
    decision?: any,
    bankAccountIds?: string[],
  ) {
    this.logger.info({ applicationId, status, score }, 'Updating application status');

    return this.prisma.application.update({
      where: { id: applicationId },
      data: {
        status,
        score,
        decision,
        bankAccountIds,
        updatedAt: new Date(),
      },
    });
  }
}
