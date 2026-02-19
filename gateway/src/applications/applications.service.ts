import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { MonoService } from 'src/mono/mono.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { InitiateApplicationDto } from './dto/initiate-application.dto';

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

    const monoApiKey = (await this.prisma.user.findUnique({
      where: { id: fintechId },
      select: { monoApiKey: true },
    }))?.monoApiKey;

    const { widgetUrl } = await this.monoService.initiateAccountLinking(
      applicant.id,
      `${firstName} ${lastName}`,
      email,
      monoApiKey,
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

    const monoApiKey = (await this.prisma.user.findUnique({
      where: { id: fintechId },
      select: { monoApiKey: true },
    }))?.monoApiKey;

    const { applicant } = application;
    const { widgetUrl } = await this.monoService.initiateAccountLinking(
      applicant.id,
      `${applicant.firstName} ${applicant.lastName}`,
      applicant.email,
      monoApiKey,
      undefined,
      applicationId,
    );

    return { widgetUrl };
  }

  async createApplication(fintechId: string, data: CreateApplicationDto) {
    const { applicantId, amount, tenor, interestRate, purpose } = data;

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
