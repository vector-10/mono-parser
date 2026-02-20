import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { MonoService } from 'src/mono/mono.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { InitiateApplicationDto } from './dto/initiate-application.dto';
import { PinoLogger } from 'nestjs-pino';

// ─── ApplicationsService ───────────────────────────────────────────────────────
//
// Owns the core application lifecycle — from the moment a fintech submits
// an applicant all the way through to the application record existing in the DB.
//
// Method overview:
//
//  initiateApplication(fintechId, data)
//    The canonical entry point for new loan applications. Creates the Applicant
//    and Application records together, then immediately calls Mono to generate
//    a Connect widget URL so the applicant can link their bank account.
//    The applicationId is passed as meta into Mono so it flows back through
//    the account_connected webhook, closing the loop for enrichment + scoring.
//
//  linkAccount(applicationId, fintechId)
//    Re-triggers Mono Connect for an existing application. Used when an applicant
//    needs to re-link (e.g. session expired, wrong account). Guards against
//    re-linking on completed or failed applications.
//
//  createApplication(fintechId, data)
//    Standalone application creation for applicants who have already linked
//    a bank account via a prior flow. Validates that the applicant exists,
//    belongs to the fintech, and has at least one linked bank account before
//    creating the application record.
//
//  findOne(applicationId, fintechId)
//    Retrieves a single application with full applicant and bank account data.
//    Scoped to the calling fintech — cannot see another fintech's records.
//
//  findAll(fintechId, status?)
//    Lists all applications for a fintech, newest first. Optionally filtered
//    by status (e.g. 'PENDING', 'LINKED', 'COMPLETED').
//
//  updateStatus(applicationId, status, score?, decision?, bankAccountIds?)
//    Internal method called by the ApplicationProcessor after the brain service
//    returns a scoring decision. Updates the application record with the final
//    status, score, decision payload, and the account IDs that were analysed.

@Injectable()
export class ApplicationsService {
  constructor(
    private prisma: PrismaService,
    private monoService: MonoService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ApplicationsService.name);
  }

  async initiateApplication(fintechId: string, data: InitiateApplicationDto) {
    const { firstName, lastName, email, phone, bvn, amount, tenor, interestRate, purpose } = data;

    this.logger.info({ fintechId, email }, 'Initiating new application');

    const applicant = await this.prisma.applicant.create({
      data: { firstName, lastName, email, phone, bvn, fintechId },
    });

    this.logger.info({ applicantId: applicant.id, fintechId }, 'Applicant created');

    const application = await this.prisma.application.create({
      data: { applicantId: applicant.id, amount, tenor, interestRate, purpose, status: 'PENDING_LINKING' },
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
      applicantId: applicant.id,
      widgetUrl,
      status: 'PENDING_LINKING',
    };
  }

  async linkAccount(applicationId: string, fintechId: string) {
    this.logger.info({ applicationId, fintechId }, 'Re-link request received');

    const application = await this.prisma.application.findFirst({
      where: { id: applicationId, applicant: { fintechId } },
      include: {
        applicant: true,
      },
    });

    if (!application) {
      this.logger.warn({ applicationId, fintechId }, 'Application not found or unauthorized for re-link');
      throw new NotFoundException('Application not found or unauthorized');
    }

    if (['COMPLETED', 'FAILED'].includes(application.status)) {
      this.logger.warn(
        { applicationId, status: application.status },
        'Re-link rejected — application is in a terminal state',
      );
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

    this.logger.info(
      { applicantId, bankAccountCount: applicant.bankAccounts.length },
      'Applicant validated — bank accounts present',
    );

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
          include: {
            bankAccounts: true,
          },
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
          include: {
            bankAccounts: true,
          },
        },
      },
    });

    if (!application) {
      this.logger.warn({ applicationId, fintechId }, 'Application not found');
      throw new NotFoundException('Application not found');
    }

    return application;
  }

  async findAll(fintechId: string, status?: string) {
    this.logger.info({ fintechId, status: status ?? 'all' }, 'Fetching applications list');

    return this.prisma.application.findMany({
      where: {
        applicant: { fintechId },
        ...(status && { status }),
      },
      include: {
        applicant: true,
      },
      orderBy: { createdAt: 'desc' },
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
