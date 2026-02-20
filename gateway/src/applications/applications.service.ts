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

// ─── ApplicationsService ───────────────────────────────────────────────────────
//
// Manages the full lifecycle of a loan application from creation to completion.
//
// initiateApplication
//   The canonical entry point for a new loan journey. In a single call it:
//   creates the applicant record, creates the application with loan terms,
//   and calls Mono to open a Connect session so the applicant can link their
//   bank account. Returns the widgetUrl the fintech opens in a webview, the
//   applicationId, and the applicantId. Application status starts as PENDING_LINKING.
//   This is the preferred flow because the applicationId is embedded in Mono's
//   meta, which means the account_connected webhook can tie the bank account
//   back to this specific application automatically.
//
// linkAccount
//   Used when an applicant needs to link an additional bank account to an
//   existing application, or when the original Mono Connect session has expired
//   and the fintech needs to give the applicant a fresh widgetUrl to try again.
//   Validates that the application belongs to the requesting fintech and has not
//   already been completed or failed, then generates a new Mono Connect URL.
//
// createApplication
//   An alternative path for fintechs that have already created their applicant
//   and linked a bank account separately (e.g. via POST /applicants/create and
//   POST /mono/initiate). Creates an application record for an existing applicant
//   who already has at least one bank account linked. Requires the bank account
//   to be present before calling this — it will throw if none are linked.
//
// findOne
//   Fetches a single application by ID, scoped to the requesting fintech.
//   Includes the applicant and all their linked bank accounts. Used by the
//   fintech to poll for application status or retrieve the final decision.
//
// findAll
//   Fetches all applications belonging to the requesting fintech, ordered by
//   most recently created. Accepts an optional status filter so the fintech can
//   query e.g. only COMPLETED or only PENDING applications.
//
// updateStatus
//   Internal method called by the application processor after the brain service
//   returns a decision. Updates the application status, score, decision payload,
//   and the list of bank account IDs that were analysed. Not exposed via HTTP.

@Injectable()
export class ApplicationsService {
  constructor(
    private prisma: PrismaService,
    private monoService: MonoService,
  ) {}

  async initiateApplication(fintechId: string, data: InitiateApplicationDto) {
    const { firstName, lastName, email, phone, bvn, amount, tenor, interestRate, purpose } = data;

    const applicant = await this.prisma.applicant.create({
      data: { firstName, lastName, email, phone, bvn, fintechId },
    });

    const application = await this.prisma.application.create({
      data: { applicantId: applicant.id, amount, tenor, interestRate, purpose, status: 'PENDING_LINKING' },
    });

    const fintech = await this.prisma.user.findUnique({
      where: { id: fintechId },
      select: { monoApiKey: true },
    });

    if (!fintech || !fintech.monoApiKey) {
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

    return {
      applicationId: application.id,
      applicantId: applicant.id,
      widgetUrl,
      status: 'PENDING_LINKING',
    };
  }

  async linkAccount(applicationId: string, fintechId: string) {
    const application = await this.prisma.application.findFirst({
      where: { id: applicationId, applicant: { fintechId } },
      include: {
        applicant: true,
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found or unauthorized');
    }

    if (['COMPLETED', 'FAILED'].includes(application.status)) {
      throw new BadRequestException(`Cannot link accounts to an application with status: ${application.status}`);
    }

    const fintech = await this.prisma.user.findUnique({
      where: { id: fintechId },
      select: { monoApiKey: true },
    });

    if (!fintech || !fintech.monoApiKey) {
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

    return { widgetUrl };
  }

  async createApplication(fintechId: string, data: CreateApplicationDto) {
    const { applicantId, amount, tenor, interestRate, purpose } = data;

    this.logger.info({ fintechId, applicantId }, 'Creating

    console.log('Service destructured:', {
      applicantId,
      amount,
      tenor,
      interestRate,
      purpose,
    });

    const applicant = await this.prisma.applicant.findFirst({
      where: { id: applicantId, fintechId },
      include: { bankAccounts: true },
    });

    if (!applicant) {
      throw new NotFoundException('Applicant not found or unauthorized');
    }

    if (!applicant.bankAccounts.length) {
      throw new BadRequestException('Applicant has not linked a bank account');
    }

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

    return application;
  }

  async findOne(applicationId: string, fintechId: string) {
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
      throw new NotFoundException('Application not found');
    }

    return application;
  }

  async findAll(fintechId: string, status?: string) {
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
